import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest } from '@rocket.chat/apps-engine/definition/api';
import { IApiResponseJSON } from '@rocket.chat/apps-engine/definition/api/IResponse';
import { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';

import ILivechatRepository from '../data/livechat/ILivechatRepository';
import LiveChatRepositoryImpl from '../data/livechat/LiveChatRepositoryImpl';
import AppError from '../domain/AppError';
import AppPersistence from '../local/app/AppPersistence';
import { PATTERN_UUID } from '../utils/Constants';
import RequestBodyValidator from '../utils/RequestBodyValidator';
import RequestHeadersValidator from '../utils/RequestHeadersValidator';
import InstanceHelper from './helpers/InstanceHelper';

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
            // validate request
            await RequestHeadersValidator.validate(read, request.headers);
            await RequestBodyValidator.validate(this.bodyConstraints, request.content);

            // initialize livechat repository
            const livechatRepo: ILivechatRepository = new LiveChatRepositoryImpl(
                await InstanceHelper.newDefaultLivechatCacheDataSource(read.getPersistenceReader(), persis),
                await InstanceHelper.newDefaultLivechatInternalDataSource(modify, read.getLivechatReader()),
                await InstanceHelper.newDefaultLivechatWebhook(http, read, persis),
            );

            // save the visitor and create a room to it
            const visitor = request.content.visitor as IVisitor;
            const email = request.content.visitor.email;
            if (email) {
                visitor.visitorEmails = [{ address: email }];
            }
            const phone = request.content.visitor.phone;
            if (phone) {
                visitor.phone = [{ phoneNumber: phone }];
            }
            const contactUUID = request.content.visitor.contactUUID;

            const createdVisitor = await livechatRepo.createVisitor(visitor);
            const room = await livechatRepo.createRoom(
                request.content.ticketID,
                contactUUID,
                createdVisitor.visitor,
            );

            // send the contact history
            const appDataSource = new AppPersistence(read.getPersistenceReader(), persis);
            const rpHostUrl = await appDataSource.getRPHostUrl();
            const id = 'send-history';
            const when = 'five seconds';
            await modify.getScheduler().scheduleOnce({ data: { contactUUID, room, rpHostUrl }, id, when });

            return this.json({ status: HttpStatusCode.CREATED, content: { id: room.id } });
        } catch (e) {
            this.app.getLogger().error(e);

            if (e.constructor.name === AppError.name) {
                return this.json({ status: e.statusCode, content: { error: e.message } });
            }
            return this.json({ status: HttpStatusCode.INTERNAL_SERVER_ERROR, content: { error: 'Unexpected error' } });
        }
    }

}
