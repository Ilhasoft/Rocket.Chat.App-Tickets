import {
    IAppAccessors,
    IConfigurationExtend,
    IEnvironmentRead,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {ApiSecurity, ApiVisibility, IApi} from '@rocket.chat/apps-engine/definition/api';
import {App} from '@rocket.chat/apps-engine/definition/App';
import {ILivechatRoom, ILivechatRoomClosedHandler, IVisitor} from '@rocket.chat/apps-engine/definition/livechat';
import {IMessage, IPostMessageSent} from '@rocket.chat/apps-engine/definition/messages';
import {IAppInfo} from '@rocket.chat/apps-engine/definition/metadata';
import {RoomType} from '@rocket.chat/apps-engine/definition/rooms';

import IAppDataSource from './src/data/app/IAppDataSource';
import ILiveChatRepository from './src/data/livechat/ILiveChatRepository';
import LiveChatRepositoryImpl from './src/data/livechat/LiveChatRepositoryImpl';
import IWebhookRepository from './src/data/webhook/IWebhookRepository';
import {CheckSecretEndpoint} from './src/endpoint/CheckSecretEndpoint';
import {CloseRoomEndpoint} from './src/endpoint/CloseRoomEndpoint';
import {CreateRoomEndpoint} from './src/endpoint/CreateRoomEndpoint';
import {SettingsEndpoint} from './src/endpoint/SettingsEndpoint';
import {VisitorMessageEndpoint} from './src/endpoint/VisitorMessageEndpoint';
import AppPersistence from './src/local/app/AppPersistence';
import LiveChatAppsEngine from './src/local/livechat/LiveChatAppsEngine';
import LiveChatPersistence from './src/local/livechat/LiveChatPersistence';
import RapidProWebhook from './src/remote/webhook/RapidProWebhook';
import {APP_SETTINGS, CONFIG_APP_SECRET} from './src/settings/Constants';

export class RapidProApp extends App implements ILivechatRoomClosedHandler, IPostMessageSent {

    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async initialize(configurationExtend: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        await this.extendConfiguration(configurationExtend);
        await configurationExtend.api.provideApi({
            visibility: ApiVisibility.PUBLIC,
            security: ApiSecurity.UNSECURE,
            endpoints: [
                new CheckSecretEndpoint(this),
                new SettingsEndpoint(this),
                new CreateRoomEndpoint(this),
                new CloseRoomEndpoint(this),
                new VisitorMessageEndpoint(this),
            ],
        } as IApi);
    }

    public async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        APP_SETTINGS.forEach((setting) => configuration.settings.provideSetting(setting));
    }

    // TODO: executePostLivechatRoomClosed is being executed twice due to a bug on Apps-engine 1.15.0, check when it's merged into 1.16.0 and use it
    public async executeLivechatRoomClosedHandler(data: ILivechatRoom, read: IRead, http: IHttp, persistence: IPersistence) {
        const visitor: IVisitor = (data.visitor as any) as IVisitor;

        const livechatRepo: ILiveChatRepository = new LiveChatRepositoryImpl(
            new LiveChatPersistence(read.getPersistenceReader(), persistence),
            new LiveChatAppsEngine({} as IModify, read.getLivechatReader()),
        );

        // look up room
        const room = await livechatRepo.getRoomByVisitorToken(visitor.token);
        if (!room) {
            this.getLogger().error(`Could not find a room for visitor token: ${visitor.token}`);
            return;
        }

        // close room through event
        await livechatRepo.eventCloseRoom(room.room);

        const appDataSource: IAppDataSource = new AppPersistence(read.getPersistenceReader(), persistence);
        const callbackUrl = await appDataSource.getCallbackUrl();
        if (!callbackUrl) {
            this.getLogger().error(`Callback URL not set`);
            return;
        }
        const secret = await read.getEnvironmentReader().getSettings().getValueById(CONFIG_APP_SECRET);
        const webhook: IWebhookRepository = new RapidProWebhook(read, http, callbackUrl, secret);

        // call webhook
        await webhook.onCloseRoom(room);
    }

    // TODO: change to an event that is only for livechat agents messages when it's available
    public async executePostMessageSent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void> {
        // check if current room is a livechat one
        if (message.room.type !== RoomType.LIVE_CHAT) {
            return;
        }
        // check if sender is an agent
        if (!message.sender.roles.includes('livechat-agent')) {
            return;
        }

        const appDataSource = new AppPersistence(read.getPersistenceReader(), persistence);
        const callbackUrl = await appDataSource.getCallbackUrl();
        if (!callbackUrl) {
            this.getLogger().error(`Callback URL not defined`);
            return;
        }
        const secret = await read.getEnvironmentReader().getSettings().getValueById(CONFIG_APP_SECRET);
        const webhook = new RapidProWebhook(read, http, callbackUrl, secret);

        const livechatRepo: ILiveChatRepository = new LiveChatRepositoryImpl(
            new LiveChatPersistence(read.getPersistenceReader(), persistence),
            new LiveChatAppsEngine({} as IModify, read.getLivechatReader()),
        );

        // look up room
        const room = await livechatRepo.getRoomByVisitorToken(message.room['visitor'].token);
        if (!room) {
            this.getLogger().error(`Could not find a room for visitor token: ${message.room['visitor'].token}`);
            return;
        }

        // call webhook
        await webhook.onAgentMessage(room, message.text, message.attachments);
    }

}
