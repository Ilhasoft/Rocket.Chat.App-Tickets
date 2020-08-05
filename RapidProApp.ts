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
import { ApiSecurity, ApiVisibility, IApi } from '@rocket.chat/apps-engine/definition/api';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { ILivechatRoom, ILivechatRoomClosedHandler, IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessage, IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import LiveChatRepositoryImpl from './src/data/livechat/LiveChatRepositoryImpl';
import { CheckSecretEndpoint } from './src/endpoint/check-secret/CheckSecretEndpoint';
import { CloseRoomEndpoint } from './src/endpoint/close-room/CloseRoomEndpoint';
import { CreateRoomEndpoint } from './src/endpoint/create-room/CreateRoomEndpoint';
import { SettingsEndpoint } from './src/endpoint/settings/SettingsEndpoint';
import { VisitorMesssageEndpoint } from './src/endpoint/visitor-message/VisitorMessageEndpoint';
import AppPersistence from './src/local/app/AppPersistence';
import LiveChatPersistence from './src/local/livechat/LiveChatPersistence';
import LiveChatAppsEngine from './src/local/livechat/LiveChatAppsEngine';
import RapidProWebhook from './src/remote/webhook/RapidProWebhook';
import { AppSettings } from './src/settings/AppSettings';
import { APP_SECRET } from './src/settings/Constants';

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
                new CreateRoomEndpoint(this),
                new VisitorMesssageEndpoint(this),
                new CloseRoomEndpoint(this),
                new SettingsEndpoint(this),
                new CheckSecretEndpoint(this),
            ],
        } as IApi);
        this.getLogger().log('RapidPro App Initialized');
    }

    public async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        AppSettings.forEach((setting) => configuration.settings.provideSetting(setting));
    }

    // TODO: executePostLivechatRoomClosed is being executed twice due to a bug on Apps-engine 1.15.0, check when it's merged into 1.16.0 and use it
    public async executeLivechatRoomClosedHandler(data: ILivechatRoom, read: IRead, http: IHttp, persistence: IPersistence) {
        const visitor: IVisitor = (data.visitor as any) as IVisitor;

        const livechatRepo = new LiveChatRepositoryImpl(
            new LiveChatPersistence(read.getPersistenceReader(), persistence),
            new LiveChatAppsEngine({} as IModify, read.getLivechatReader()),
        );

        const room = await livechatRepo.getRoomByVisitorToken(visitor.token);
        if (!room) {
            const errorMessage = `Could not find room for visitor with token: ${visitor.token}`;
            this.getLogger().error(errorMessage);
            return;
        }

        await livechatRepo.eventCloseRoom(room.room);

        const appCache = new AppPersistence(read.getPersistenceReader(), persistence);
        const callbackUrl = await appCache.getCallbackUrl();
        if (!callbackUrl) {
            const errorMessage = `Callback URL not defined`;
            this.getLogger().error(errorMessage);
            return;
        }
        const secret = await read.getEnvironmentReader().getSettings().getValueById(APP_SECRET);
        const rapidproWebhook = new RapidProWebhook(read, http, callbackUrl, secret);

        await rapidproWebhook.onCloseRoom(room);

    }

    // TODO: change to an event that is only for livechat agents messages when it's available
    public async executePostMessageSent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void> {
        if (message.room.type === RoomType.LIVE_CHAT) { // check if current room is a livechat one
            if (message.sender.roles.includes('livechat-agent')) { // check if sender is an agent
                const appCache = new AppPersistence(read.getPersistenceReader(), persistence);
                const callbackUrl = await appCache.getCallbackUrl();
                if (!callbackUrl) {
                    const errorMessage = `Callback URL not defined`;
                    this.getLogger().error(errorMessage);
                    return;
                }
                const secret = await read.getEnvironmentReader().getSettings().getValueById(APP_SECRET);
                const rapidproWebhook = new RapidProWebhook(read, http, callbackUrl, secret);

                const livechatRepo = new LiveChatRepositoryImpl(
                    new LiveChatPersistence(read.getPersistenceReader(), persistence),
                    new LiveChatAppsEngine({} as IModify, read.getLivechatReader()),
                );

                const room = await livechatRepo.getRoomByVisitorToken(message.room['visitor'].token);
                if (!room) {
                    const errorMessage = `Could not find room for visitor with token: ${message.room['visitor'].token}`;
                    this.getLogger().error(errorMessage);
                    return;
                }

                await rapidproWebhook.sendAgentMessage(room, message.text, message.attachments);
            }
        }
    }

}
