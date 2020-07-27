import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest } from '@rocket.chat/apps-engine/definition/api';
import { IApiResponseJSON } from '@rocket.chat/apps-engine/definition/api/IResponse';

import AppError from '../../domain/AppError';
import AppPreferences from '../../local/app/AppPreferences';
import HeaderValidator from '../../utils/HeaderValidator';
import validateRequest from './ValidateSettingsEndpoint';

export class SettingsEndpoint extends ApiEndpoint {
    public path = 'settings';

    public async put(
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

            const appCache = new AppPreferences(read.getPersistenceReader(), persis);
            const callbackUrl = request.content.webhook.url;
            await appCache.setCallbackUrl(callbackUrl);

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
