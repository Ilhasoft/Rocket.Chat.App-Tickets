import {HttpStatusCode, IHttp, IModify, IPersistence, IRead} from '@rocket.chat/apps-engine/definition/accessors';
import {ApiEndpoint, IApiEndpointInfo, IApiRequest} from '@rocket.chat/apps-engine/definition/api';
import {IApiResponseJSON} from '@rocket.chat/apps-engine/definition/api/IResponse';

import IAppDataSource from '../data/app/IAppDataSource';
import AppError from '../domain/AppError';
import AppPersistence from '../local/app/AppPersistence';
import RequestBodyValidator from '../utils/RequestBodyValidator';
import RequestHeadersValidator from '../utils/RequestHeadersValidator';

export class SettingsEndpoint extends ApiEndpoint {

    public path = 'settings';

    private bodyConstraints = {
        'webhook': {
            presence: {
                allowEmpty: false,
            },
        },
        'webhook.url': {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
            url: true,
        },
    };

    public async put(
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

            const callbackUrl = request.content.webhook.url;
            const appDataSource: IAppDataSource = new AppPersistence(read.getPersistenceReader(), persis);

            await appDataSource.setCallbackUrl(callbackUrl);
            return this.json({status: HttpStatusCode.CREATED});
        } catch (e) {
            this.app.getLogger().error(e);

            if (e.constructor.name === AppError.name) {
                return this.json({status: e.statusCode, content: {error: e.message}});
            }
            return this.json({status: HttpStatusCode.INTERNAL_SERVER_ERROR, content: {error: 'Unexpected error'}});
        }
    }
}
