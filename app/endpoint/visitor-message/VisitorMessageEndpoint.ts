import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest } from '@rocket.chat/apps-engine/definition/api';
import { IApiResponseJSON } from '@rocket.chat/apps-engine/definition/api/IResponse';
import LiveChatCacheStrategyRepositoryImpl from '../../data/livechat/cache-strategy/LiveChatCacheStrategyRepositoryImpl';
import LiveChatCacheHandler from '../../local/livechat/cache-strategy/LiveChatCacheHandler';
import ILiveChatCredentials from '../../remote/livechat/cache-strategy/ILiveChatCredentials';
import LiveChatRestApi from '../../remote/livechat/cache-strategy/LiveChatRestApi';
import { RC_ACCESS_TOKEN, RC_SERVER_URL, RC_USER_ID, REQUEST_TIMEOUT } from '../../settings/Constants';
import validateRequest from './ValidateVisitorMessageEndpoint';

export class VisitorMesssageEndpoint extends ApiEndpoint {
    public path = 'visitor-message';

    public async get(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<IApiResponseJSON> {

        // Query parameters verification
        const errors = validateRequest(request.query);
        if (errors) {
            const errorMessage = `Invalid query parameters...: ${JSON.stringify(errors)}`;
            this.app.getLogger().error(errorMessage);
            return this.json({status: HttpStatusCode.BAD_REQUEST, content: {error: errorMessage}});
        }

        const baseUrl: string = await read.getEnvironmentReader().getServerSettings().getValueById(RC_SERVER_URL);
        const timeout: number = await read.getEnvironmentReader().getSettings().getValueById(REQUEST_TIMEOUT);
        const credentials: ILiveChatCredentials = {
            authToken: await read.getEnvironmentReader().getSettings().getValueById(RC_ACCESS_TOKEN),
            userId: await read.getEnvironmentReader().getSettings().getValueById(RC_USER_ID),
        };

        // livechatRepo initialization
        const livechatRepo = new LiveChatCacheStrategyRepositoryImpl(
            new LiveChatCacheHandler(read.getPersistenceReader(), persis),
            new LiveChatRestApi(http, baseUrl, credentials, timeout),
        );

        // get visitor from cache
        const visitor = await livechatRepo.getVisitor(request.query.contactUuid);
        if (!visitor) {
            const errorMessage = `Could not find visitor with token: ${request.query.contactUuid}`;
            this.app.getLogger().error(errorMessage);
            return this.json({status: HttpStatusCode.NOT_FOUND, content: {error: errorMessage}});
        }

        // get the visitor room
        const room = await read.getRoomReader().getById(visitor.roomId);
        if (!room) {
            const errorMessage = `Could not find room with id: ${visitor.roomId}`;
            this.app.getLogger().error(errorMessage);
            return this.json({status: HttpStatusCode.NOT_FOUND, content: {error: errorMessage}});
        }

        // build and send message
        const sender = await read.getLivechatReader().getLivechatVisitorByToken(visitor.token);
        const livechatMessageBuilder = await modify.getCreator().startLivechatMessage()
            .setRoom(room)
            .setVisitor(sender!);
        if (request.query.msg) {
            livechatMessageBuilder.setText(request.query.msg);
        } // TODO: else to handle attachments
        await modify.getCreator().finish(livechatMessageBuilder);

        return this.success();
    }
}
