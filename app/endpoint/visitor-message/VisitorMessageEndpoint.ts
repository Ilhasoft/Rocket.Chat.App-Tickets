import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest } from '@rocket.chat/apps-engine/definition/api';
import { IApiResponseJSON } from '@rocket.chat/apps-engine/definition/api/IResponse';

import LiveChatCacheStrategyRepositoryImpl from '../../data/livechat/cache-strategy/LiveChatCacheStrategyRepositoryImpl';
import AppError from '../../domain/AppError';
import LiveChatCacheHandler from '../../local/livechat/cache-strategy/LiveChatCacheHandler';
import LiveChatInternalHandler from '../../local/livechat/cache-strategy/LiveChatInternalHandler';
import HeaderValidator from '../../utils/HeaderValidator';
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

        try {
            // Headers validation
            const headerValidator = new HeaderValidator(read);
            await headerValidator.validate(request.headers);

            // Query parameters verification
            validateRequest(request.content);

            // livechatRepo initialization
            const livechatRepo = new LiveChatCacheStrategyRepositoryImpl(
                new LiveChatCacheHandler(read.getPersistenceReader(), persis),
                new LiveChatInternalHandler(modify, read.getLivechatReader()),
            );

            // get room from cache
            const room = await livechatRepo.getRoomByVisitorToken(request.content.visitor.token);

            // TODO: Validate attachments
            // const attachments = JSON.parse(request.content.attachments);
            const messageId = await livechatRepo.sendMessage(request.content.text, [], room.room);
            return this.json({status: HttpStatusCode.CREATED, content: {id: messageId}});
        } catch (e) {
            this.app.getLogger().error(e);
            if (e.constructor.name === AppError.name) {
                return this.json({status: e.statusCode, content: {error: e.message}});
            }

            return this.json({status: HttpStatusCode.INTERNAL_SERVER_ERROR, content: {error: 'Unexpected error'}});
        }

    }
}
