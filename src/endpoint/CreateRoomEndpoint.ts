import {HttpStatusCode, IHttp, IModify, IPersistence, IRead} from '@rocket.chat/apps-engine/definition/accessors';
import {ApiEndpoint, IApiEndpointInfo, IApiRequest} from '@rocket.chat/apps-engine/definition/api';
import {IApiResponseJSON} from '@rocket.chat/apps-engine/definition/api/IResponse';
import {IVisitor} from '@rocket.chat/apps-engine/definition/livechat';

import ILivechatRepository from '../data/livechat/ILivechatRepository';
import LiveChatRepositoryImpl from '../data/livechat/LiveChatRepositoryImpl';
import IRapidProRemoteDataSource from '../data/rapidpro/IRapidProRemoteDataSource';
import AppError from '../domain/AppError';
import AppPersistence from '../local/app/AppPersistence';
import RapidProRestApi from '../remote/rapidpro/RapidProRestApi';
import {CONFIG_RAPIDPRO_AUTH_TOKEN, CONFIG_REQUEST_TIMEOUT, RC_SERVER_URL} from '../settings/Constants';
import {PATTERN_UUID} from '../utils/Constants';
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
        'sessionStart': {
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

            const sessionStart = request.content.sessionStart;
            if (sessionStart) {
                await RequestBodyValidator.validateDateString(sessionStart);
            }

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
                visitor.visitorEmails = [{address: email}];
            }
            const phone = request.content.visitor.phone;
            if (phone) {
                visitor.phone = [{phoneNumber: phone}];
            }

            const createdVisitor = await livechatRepo.createVisitor(visitor);

            // TODO: this is a workaround, need to modify to use future appsEngine customFields updater
            const siteUrl = await read.getEnvironmentReader().getServerSettings().getValueById(RC_SERVER_URL);
            const payload = {
                token: createdVisitor.visitor.token,
                customFields: this.createCustomFieldsArray(request.content.visitor.customFields),
            };
            await http.post(`${siteUrl}/api/v1/livechat/custom.fields`, { data: payload});

            const room = await livechatRepo.createRoom(
                request.content.ticketID,
                request.content.visitor.contactUUID,
                createdVisitor.visitor,
            );

            // send chatbot history to agent if session start is set
            if (sessionStart) {
                const appDataSource = new AppPersistence(read.getPersistenceReader(), persis);
                const rpHostUrl = await appDataSource.getRPHostUrl();
                const rpAuthToken = await read.getEnvironmentReader().getSettings().getValueById(CONFIG_RAPIDPRO_AUTH_TOKEN);
                const reqTimeout = await read.getEnvironmentReader().getSettings().getValueById(CONFIG_REQUEST_TIMEOUT);

                if (rpHostUrl && rpAuthToken) {
                    const rapidProDataSource: IRapidProRemoteDataSource = new RapidProRestApi(
                        http,
                        rpHostUrl,
                        rpAuthToken,
                        reqTimeout ? reqTimeout : 5,
                    );
                    const messages = await rapidProDataSource.getMessages(
                        request.content.visitor.contactUUID,
                        sessionStart,
                    );
                    await livechatRepo.sendChatbotHistory(messages, room);
                }
            }

            return this.json({status: HttpStatusCode.CREATED, content: {id: room.id}});
        } catch (e) {
            this.app.getLogger().error(e);

            if (e.constructor.name === AppError.name) {
                return this.json({status: e.statusCode, content: {error: e.message}});
            }
            if (e.constructor.name === RangeError.name) {
                const errorMsg = `"sessionStart": "Session start is invalid"`;
                return this.json({status: HttpStatusCode.BAD_REQUEST, content: {error: errorMsg}});
            }
            return this.json({status: HttpStatusCode.INTERNAL_SERVER_ERROR, content: {error: 'Unexpected error'}});
        }
    }

    // TODO: remove when future appsEngine customFields updater is available
    private createCustomFieldsArray(customFields: {[key: string]: any}): Array<{[key: string]: any}> {
        const entries = Object.entries(customFields);
        return entries.map((field) => {
            return {
                key: field[0],
                value: field[1],
                overwrite: true,
            };
        });
    }

}
