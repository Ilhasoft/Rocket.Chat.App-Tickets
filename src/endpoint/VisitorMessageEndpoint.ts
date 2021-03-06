import {HttpStatusCode, IHttp, IModify, IPersistence, IRead} from '@rocket.chat/apps-engine/definition/accessors';
import {ApiEndpoint, IApiEndpointInfo, IApiRequest} from '@rocket.chat/apps-engine/definition/api';
import {IApiResponseJSON} from '@rocket.chat/apps-engine/definition/api/IResponse';

import ILivechatRepository from '../data/livechat/ILivechatRepository';
import LiveChatRepositoryImpl from '../data/livechat/LiveChatRepositoryImpl';
import AppError from '../domain/AppError';
import RequestBodyValidator from '../utils/RequestBodyValidator';
import RequestHeadersValidator from '../utils/RequestHeadersValidator';
import InstanceHelper from './helpers/InstanceHelper';

export class VisitorMessageEndpoint extends ApiEndpoint {

    public path = 'visitor-message';

    private bodyConstraints = {
        'visitor': {
            presence: {
                allowEmpty: false,
            },
        },
        'visitor.token': {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
        },
        'text': {
            presence: false,
            type: 'string',
        },
        'attachments': {
            presence: false,
            type: 'array',
        },
    };

    public async post(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<IApiResponseJSON> {
        try {
            // validate request
            await RequestHeadersValidator.validate(read, request.headers);
            await RequestBodyValidator.validate(this.bodyConstraints, request.content);

            // initialize livechat repository
            const livechatRepo: ILivechatRepository = new LiveChatRepositoryImpl(
                await InstanceHelper.newDefaultLivechatCacheDataSource(read.getPersistenceReader(), persis),
                await InstanceHelper.newDefaultLivechatInternalDataSource(modify, read.getLivechatReader()),
                await InstanceHelper.newDefaultLivechatWebhook(http, read, persis),
            );
            const room = await livechatRepo.getRoomByVisitorToken(request.content.visitor.token);
            const msgID = await livechatRepo.sendVisitorMessage(room, request.content.text, request.content.attachments);

            return this.json({status: HttpStatusCode.CREATED, content: {id: msgID}});
        } catch (e) {
            this.app.getLogger().error(e);

            if (e.constructor.name === AppError.name) {
                return this.json({status: e.statusCode, content: {error: e.message}});
            }
            return this.json({status: HttpStatusCode.INTERNAL_SERVER_ERROR, content: {error: 'Unexpected error'}});
        }
    }
}
