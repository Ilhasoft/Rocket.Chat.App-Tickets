import { HttpStatusCode, IRead } from '@rocket.chat/apps-engine/definition/accessors';

import { APP_SECRET } from '../settings/Constants';

export default class HeaderValidator {
    constructor(private readonly read: IRead) {}

    public async validate(headers: {[key: string]: string}): Promise<{status: HttpStatusCode, error?: string}> {

        let appSecret = await this.read.getEnvironmentReader().getSettings().getValueById(APP_SECRET);

        if (headers['content-type'] !== 'application/json') {
            return {status: HttpStatusCode.BAD_REQUEST, error: 'Invalid Content-Type header'};
        }

        if (!appSecret) {
            return {status: HttpStatusCode.FORBIDDEN, error: 'Unconfigured secret'};
        }
        appSecret = `Token ${appSecret}`;
        if (headers.authorization !== appSecret) {
            return {status: HttpStatusCode.UNAUTHORIZED, error: 'Configured secrets do not match'};
        }

        return {status: HttpStatusCode.NO_CONTENT};
    }

}
