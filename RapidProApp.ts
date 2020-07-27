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

import LiveChatCacheStrategyRepositoryImpl from './app/data/livechat/cache-strategy/LiveChatCacheStrategyRepositoryImpl';
import { CheckSecretEndpoint } from './app/endpoint/check-secret/CheckSecretEndpoint';
import { CloseRoomEndpoint } from './app/endpoint/close-room/CloseRoomEndpoint';
import { CreateRoomEndpoint } from './app/endpoint/create-room/CreateRoomEndpoint';
import { SettingsEndpoint } from './app/endpoint/settings/SettingsEndpoint';
import { VisitorMesssageEndpoint } from './app/endpoint/visitor-message/VisitorMessageEndpoint';
import AppPreferences from './app/local/app/AppPreferences';
import LiveChatCacheHandler from './app/local/livechat/cache-strategy/LiveChatCacheHandler';
import LiveChatInternalHandler from './app/local/livechat/cache-strategy/LiveChatInternalHandler';
import RapidProWebhook from './app/remote/hooks/rapidpro/RapidProWebhook';
import { AppSettings } from './app/settings/AppSettings';
import { APP_SECRET } from './app/settings/Constants';

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

        const livechatRepo = new LiveChatCacheStrategyRepositoryImpl(
            new LiveChatCacheHandler(read.getPersistenceReader(), persistence),
            new LiveChatInternalHandler({} as IModify, read.getLivechatReader()),
        );

        const room = await livechatRepo.getRoomByVisitorToken(visitor.token);
        if (!room) {
            const errorMessage = `Could not find room for visitor with token: ${visitor.token}`;
            this.getLogger().error(errorMessage);
            return;
        }

        await livechatRepo.eventCloseRoom(room.room);

        const appCache = new AppPreferences(read.getPersistenceReader(), persistence);
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
                const appCache = new AppPreferences(read.getPersistenceReader(), persistence);
                const callbackUrl = await appCache.getCallbackUrl();
                if (!callbackUrl) {
                    const errorMessage = `Callback URL not defined`;
                    this.getLogger().error(errorMessage);
                    return;
                }
                const secret = await read.getEnvironmentReader().getSettings().getValueById(APP_SECRET);
                const rapidproWebhook = new RapidProWebhook(read, http, callbackUrl, secret);

                const livechatRepo = new LiveChatCacheStrategyRepositoryImpl(
                    new LiveChatCacheHandler(read.getPersistenceReader(), persistence),
                    new LiveChatInternalHandler({} as IModify, read.getLivechatReader()),
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
