import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest } from '@rocket.chat/apps-engine/definition/api';
import { IApiResponseJSON } from '@rocket.chat/apps-engine/definition/api/IResponse';

import AppPreferences from '../../local/app/AppPreferences';
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

        // Query parameters verification
        const errors = validateRequest(request.content);
        if (errors) {
            const errorMessage = `Invalid query parameters...: ${JSON.stringify(errors)}`;
            this.app.getLogger().error(errorMessage);
            return this.json({status: HttpStatusCode.BAD_REQUEST, content: {error: errorMessage}});
        }

        const appCache = new AppPreferences(read.getPersistenceReader(), persis);
        const callbackUrl = request.content.webhook.url;
        await appCache.setCallbackUrl(callbackUrl);

        return this.json({status: HttpStatusCode.CREATED});
    }
}
