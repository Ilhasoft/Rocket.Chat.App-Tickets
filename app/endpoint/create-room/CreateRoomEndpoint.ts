import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest } from '@rocket.chat/apps-engine/definition/api';
import { IApiResponseJSON } from '@rocket.chat/apps-engine/definition/api/IResponse';
import { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';

import LiveChatCacheStrategyRepositoryImpl from '../../data/livechat/cache-strategy/LiveChatCacheStrategyRepositoryImpl';
import AppError from '../../domain/AppError';
import LiveChatCacheHandler from '../../local/livechat/cache-strategy/LiveChatCacheHandler';
import LiveChatInternalHandler from '../../local/livechat/cache-strategy/LiveChatInternalHandler';
import HeaderValidator from '../../utils/HeaderValidator';
import validateRequest from './ValidateCreateRoomRequest';

export class CreateRoomEndpoint extends ApiEndpoint {
    public path = 'room';

    public async get(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<IApiResponseJSON> {

        try {
            const headerValidator = new HeaderValidator(read);
            await headerValidator.validate(request.headers);

            // Query parameters verification
            validateRequest(request.content);

            // livechatRepo initialization
            const livechatRepo = new LiveChatCacheStrategyRepositoryImpl(
                new LiveChatCacheHandler(read.getPersistenceReader(), persis),
                new LiveChatInternalHandler(modify, read.getLivechatReader()),
                );

            // Execute visitor and room creation
            const visitor = request.content.visitor as IVisitor;
            const createdVisitor = await livechatRepo.createVisitor(visitor);
            const room = await livechatRepo.createRoom(
                request.content.ticketId,
                request.content.visitor.contactUuid,
                createdVisitor.visitor,
            );
            return this.json({status: HttpStatusCode.CREATED, content: {id: room.id}});
        } catch (e) {
            this.app.getLogger().error(e);
            if (e.constructor.name === AppError.name) {
                return this.json({status: e.statusCode, content: {error: e.message}});
            }

            return this.json({status: HttpStatusCode.INTERNAL_SERVER_ERROR, content: {error: 'Unexpected error'}});
        }

    }

}
