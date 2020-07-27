import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest } from '@rocket.chat/apps-engine/definition/api';
import { IApiResponseJSON } from '@rocket.chat/apps-engine/definition/api/IResponse';

import HeaderValidator from '../../utils/HeaderValidator';

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

        // Headers validation
        const headerValidator = new HeaderValidator(read);
        const valid = await headerValidator.validate(request.headers);
        if (valid.status >= 300) {
            this.app.getLogger().error(valid.error);
            return this.json({status: valid.status, content: {error: valid.error}});
        }

        return this.json({status: valid.status});
    }
}
