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
import {ILivechatRoom, IPostLivechatRoomClosed, IVisitor} from '@rocket.chat/apps-engine/definition/livechat';
import {IMessage, IPostMessageSent} from '@rocket.chat/apps-engine/definition/messages';
import {IAppInfo} from '@rocket.chat/apps-engine/definition/metadata';
import {RoomType} from '@rocket.chat/apps-engine/definition/rooms';
import ILiveChatRepository from './src/data/livechat/ILiveChatRepository';
import LiveChatRepositoryImpl from './src/data/livechat/LiveChatRepositoryImpl';
import {CheckSecretEndpoint} from './src/endpoint/CheckSecretEndpoint';
import {CloseRoomEndpoint} from './src/endpoint/CloseRoomEndpoint';
import {CreateRoomEndpoint} from './src/endpoint/CreateRoomEndpoint';
import InstanceHelper from './src/endpoint/helpers/InstanceHelper';
import {SettingsEndpoint} from './src/endpoint/SettingsEndpoint';
import {VisitorMessageEndpoint} from './src/endpoint/VisitorMessageEndpoint';
import {APP_SETTINGS} from './src/settings/Constants';

export class RapidProApp extends App implements IPostLivechatRoomClosed, IPostMessageSent {

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

    // TODO: change to an event that is only for livechat agents messages when it's available
    public async executePostMessageSent(
        message: IMessage,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify,
    ): Promise<void> {
        // check if current room is a livechat one
        if (message.room.type !== RoomType.LIVE_CHAT) {
            return;
        }

        // check if sender is an agent
        if (!message.sender.roles || !message.sender.roles.includes('livechat-agent')) {
            return;
        }

        try {
            // initialize livechat repository
            const livechatRepo: ILiveChatRepository = new LiveChatRepositoryImpl(
                await InstanceHelper.newDefaultLivechatCacheDataSource(read.getPersistenceReader(), persistence),
                await InstanceHelper.newDefaultLivechatInternalDataSource(modify, read.getLivechatReader()),
                await InstanceHelper.newDefaultLivechatWebhook(http, read, persistence),
            );

            // look up room
            const room = await livechatRepo.getRoomByVisitorToken(message.room['visitor'].token);
            if (!room) {
                this.getLogger().error(`Could not find a room for visitor token: ${message.room['visitor'].token}`);
                return;
            }

            // call agent message event
            await livechatRepo.sendAgentMessage(room, message.text, message.attachments);
        } catch (e) {
            this.getLogger().error(e.message);
        }
    }

    public async executePostLivechatRoomClosed(
        data: ILivechatRoom,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
    ) {
        const visitor: IVisitor = (data.visitor as any) as IVisitor;

        try {
            // initialize livechat repository
            const livechatRepo: ILiveChatRepository = new LiveChatRepositoryImpl(
                await InstanceHelper.newDefaultLivechatCacheDataSource(read.getPersistenceReader(), persistence),
                await InstanceHelper.newDefaultLivechatInternalDataSource({} as IModify, read.getLivechatReader()),
                await InstanceHelper.newDefaultLivechatWebhook(http, read, persistence),
            );

            // look up room
            const room = await livechatRepo.getRoomByVisitorToken(visitor.token);
            if (!room) {
                this.getLogger().error(`Could not find a room for visitor token: ${visitor.token}`);
                return;
            }

            // close room through event
            await livechatRepo.eventCloseRoom(room);
        } catch (e) {
            this.getLogger().error(e.message);
        }
    }

}
