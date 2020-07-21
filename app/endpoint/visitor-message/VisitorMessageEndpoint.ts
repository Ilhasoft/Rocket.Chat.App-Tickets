import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest } from '@rocket.chat/apps-engine/definition/api';
import { IApiResponseJSON } from '@rocket.chat/apps-engine/definition/api/IResponse';
import LiveChatCacheStrategyRepositoryImpl from '../../data/livechat/cache-strategy/LiveChatCacheStrategyRepositoryImpl';
import LiveChatCacheHandler from '../../local/livechat/cache-strategy/LiveChatCacheHandler';
import LiveChatInternalHandler from '../../local/livechat/cache-strategy/LiveChatInternalHandler';
import ILiveChatCredentials from '../../remote/livechat/cache-strategy/ILiveChatCredentials';
import { RC_SERVER_URL, REQUEST_TIMEOUT } from '../../settings/Constants';
import validateRequest from './ValidateVisitorMessageEndpoint';

export class VisitorMesssageEndpoint extends ApiEndpoint {
    public path = 'visitor-message';

    // TODO: change to POST when emojis are sent properly
    public async post(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<IApiResponseJSON> {

        // Query parameters verification
        const errors = validateRequest(request.content);
        if (errors) {
            const errorMessage = `Invalid content parameters...: ${JSON.stringify(errors)}`;
            this.app.getLogger().error(errorMessage);
            return this.json({status: HttpStatusCode.BAD_REQUEST, content: {error: errorMessage}});
        }

        // livechatRepo initialization
        const livechatRepo = new LiveChatCacheStrategyRepositoryImpl(
            new LiveChatCacheHandler(read.getPersistenceReader(), persis),
            new LiveChatInternalHandler(modify, read.getLivechatReader()),
        );

        // get room from cache
        const room = await livechatRepo.getRoomByVisitorToken(request.content.visitor.token);
        if (!room) {
            const errorMessage = `Could not find room for visitor with token: ${request.content.visitor.token}`;
            this.app.getLogger().error(errorMessage);
            return this.json({status: HttpStatusCode.NOT_FOUND, content: {error: errorMessage}});
        }

        // TODO: Validate attachments
        // const attachments = JSON.parse(request.content.attachments);
        await livechatRepo.sendMessage(request.content.text, [], room.room);

        return this.success();
    }
}
