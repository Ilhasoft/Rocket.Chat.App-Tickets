import {HttpStatusCode, IHttp, IModify, IPersistence, IRead} from '@rocket.chat/apps-engine/definition/accessors';
import {ApiEndpoint, IApiEndpointInfo, IApiRequest} from '@rocket.chat/apps-engine/definition/api';
import {IApiResponseJSON} from '@rocket.chat/apps-engine/definition/api/IResponse';
import {IVisitor} from '@rocket.chat/apps-engine/definition/livechat';

import ILiveChatRepository from '../data/livechat/ILiveChatRepository';
import LiveChatRepositoryImpl from '../data/livechat/LiveChatRepositoryImpl';
import AppError from '../domain/AppError';
import LiveChatAppsEngine from '../local/livechat/LiveChatAppsEngine';
import LiveChatPersistence from '../local/livechat/LiveChatPersistence';
import {PATTERN_DATE_ISO8601, PATTERN_UUID} from '../settings/Constants';
import RequestBodyValidator from '../utils/RequestBodyValidator';
import RequestHeadersValidator from '../utils/RequestHeadersValidator';

export class CreateRoomEndpoint extends ApiEndpoint {

    public path = 'room';

    private bodyConstraints = {
        'ticketID': {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
            format: {
                pattern: PATTERN_UUID,
            },
        },
        'priority': {
            presence: false,
            type: 'string',
        },
        // TODO
        // 'sessionStart': {
        //     presence: false,
        //     type: 'string',
        //     format: {
        //         pattern: PATTERN_DATE_ISO8601,
        //     },
        // },
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
        'visitor.contactUUID': {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
            format: {
                pattern: PATTERN_UUID,
            },
        },
        'visitor.department': {
            presence: false,
            type: 'string',
        },
        'visitor.name': {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
        },
        'visitor.email': {
            presence: false,
            email: true,
            type: 'string',
        },
        'visitor.phone': {
            presence: false,
            type: 'string',
        },
        'visitor.customFields': {
            presence: false,
            type: 'array',
        },
    };

    public async get(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<IApiResponseJSON> {
        try {
            await RequestHeadersValidator.validate(read, request.headers);
            await RequestBodyValidator.validate(this.bodyConstraints, request.content);

            const livechatRepo: ILiveChatRepository = new LiveChatRepositoryImpl(
                new LiveChatPersistence(read.getPersistenceReader(), persis),
                new LiveChatAppsEngine(modify, read.getLivechatReader()),
            );

            // save the visitor and create a room to it
            const visitor = request.content.visitor as IVisitor;
            const createdVisitor = await livechatRepo.createVisitor(visitor);
            const room = await livechatRepo.createRoom(
                request.content.ticketID,
                request.content.visitor.contactUUID,
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
