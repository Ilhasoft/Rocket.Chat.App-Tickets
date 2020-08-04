import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest } from '@rocket.chat/apps-engine/definition/api';
import { IApiResponseJSON } from '@rocket.chat/apps-engine/definition/api/IResponse';

import LiveChatRepositoryImpl from '../../data/livechat/LiveChatRepositoryImpl';
import AppError from '../../domain/AppError';
import LiveChatPersistence from '../../local/livechat/LiveChatPersistence';
import LiveChatAppsEngine from '../../local/livechat/LiveChatAppsEngine';
import RequestHeadersValidator from '../../utils/RequestHeadersValidator';
import validateRequest from './ValidateCloseRoomRequest';

export class CloseRoomEndpoint extends ApiEndpoint {
    public path = 'room.close';

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
            await RequestHeadersValidator.validate(read, request.headers);

            // Query parameters verification
            validateRequest(request.content);

            // livechatRepo initialization
            const livechatRepo = new LiveChatRepositoryImpl(
                new LiveChatPersistence(read.getPersistenceReader(), persis),
                new LiveChatAppsEngine(modify, read.getLivechatReader()),
            );

            await livechatRepo.endpointCloseRoom(request.content.visitor.token, request.content.comment);
        } catch (e) {
            this.app.getLogger().error(e);
            if (e.constructor.name === AppError.name) {
                return this.json({ status: e.statusCode, content: { error: e.message } });
            }

            return this.json({ status: HttpStatusCode.INTERNAL_SERVER_ERROR, content: { error: 'Unexpected error' } });
        }

        return this.success();
    }

}
