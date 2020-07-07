import {HttpStatusCode, IHttp, IModify, IPersistence, IRead} from '@rocket.chat/apps-engine/definition/accessors';
import {ApiEndpoint, IApiEndpointInfo, IApiRequest} from '@rocket.chat/apps-engine/definition/api';
import {IApiResponseJSON} from '@rocket.chat/apps-engine/definition/api/IResponse';
import AppCacheHandler from '../../local/app/cache-strategy/AppCacheHandler';
import validateRequest from './ValidateSetCallbackEndpoint';

export class SetCallbackEndpoint extends ApiEndpoint {
    public path = 'setCallback';

    public async put(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<IApiResponseJSON> {

        // Query parameters verification
        const errors = validateRequest(request.query);
        if (errors) {
            const errorMessage = `Invalid query parameters...: ${JSON.stringify(errors)}`;
            this.app.getLogger().error(errorMessage);
            return this.json({status: HttpStatusCode.BAD_REQUEST, content: {error: errorMessage}});
        }

        const appCache = new AppCacheHandler(read.getPersistenceReader(), persis);
        const callbackUrl = request.query.url;
        await appCache.setCallbackUrl(callbackUrl);

        return this.json({status: HttpStatusCode.CREATED});
    }
}
