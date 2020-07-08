import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest } from '@rocket.chat/apps-engine/definition/api';
import { IApiResponseJSON } from '@rocket.chat/apps-engine/definition/api/IResponse';
import LiveChatCacheStrategyRepositoryImpl from '../../data/livechat/cache-strategy/LiveChatCacheStrategyRepositoryImpl';
import LiveChatCacheHandler from '../../local/livechat/cache-strategy/LiveChatCacheHandler';
import LiveChatInternalHandler from '../../local/livechat/cache-strategy/LiveChatInternalHandler';
import ILiveChatCredentials from '../../remote/livechat/cache-strategy/ILiveChatCredentials';
import LiveChatRestApi from '../../remote/livechat/cache-strategy/LiveChatRestApi';
import { RC_ACCESS_TOKEN, RC_SERVER_URL, RC_USER_ID, REQUEST_TIMEOUT } from '../../settings/Constants';
import validateRequest from './ValidateVisitorMessageEndpoint';

export class VisitorMesssageEndpoint extends ApiEndpoint {
    public path = 'message';

    // TODO: change to POST when emojis are sent properly
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
            new LiveChatInternalHandler(modify),
        );

        // get room from cache
        const roomCache = await livechatRepo.getRoomByVisitor(request.query.contactUuid);
        if (!roomCache) {
            const errorMessage = `Could not find visitor with token: ${request.query.contactUuid}`;
            this.app.getLogger().error(errorMessage);
            return this.json({status: HttpStatusCode.NOT_FOUND, content: {error: errorMessage}});
        }

        // TODO: Validate attachments
        const attachments = JSON.parse(request.query.attachments);
        await livechatRepo.sendMessage(request.query.msg, attachments, roomCache);

        return this.success();
    }
}
