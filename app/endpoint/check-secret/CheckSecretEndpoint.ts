import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest } from '@rocket.chat/apps-engine/definition/api';
import { IApiResponseJSON } from '@rocket.chat/apps-engine/definition/api/IResponse';

import { APP_SECRET } from '../../settings/Constants';

export class CheckSecretEndpoint extends ApiEndpoint {
    public path = 'secret.check';

    public async get(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<IApiResponseJSON> {

        const incomingSecret = request.headers.authorization;
        let appSecret = await read.getEnvironmentReader().getSettings().getValueById(APP_SECRET);
        if (!appSecret) {
            return this.json({status: HttpStatusCode.FORBIDDEN, content: {error: 'Unconfigured secret'}});
        }
        appSecret = `Token ${appSecret}`;
        if (incomingSecret !== appSecret) {
            return this.json({status: HttpStatusCode.UNAUTHORIZED, content: {error: 'Configured secrets do not match'}});
        }

        return this.json({status: HttpStatusCode.NO_CONTENT});
    }
}
