import { HttpStatusCode, IRead } from '@rocket.chat/apps-engine/definition/accessors';

import AppError from '../domain/AppError';
import { APP_SECRET } from '../settings/Constants';

export default class RequestHeadersValidator {

    public static async validate(read: IRead, headers: {[key: string]: string}) {
        if (headers['content-type'] !== 'application/json') {
            throw new AppError('Invalid Content-Type header', HttpStatusCode.BAD_REQUEST);
        }

        let appSecret = await read.getEnvironmentReader().getSettings().getValueById(APP_SECRET);
        if (!appSecret) {
            throw new AppError('Secret not set', HttpStatusCode.FORBIDDEN);
        }

        appSecret = `Token ${appSecret}`;
        if (headers.authorization !== appSecret) {
            throw new AppError('Invalid Authorization header', HttpStatusCode.FORBIDDEN);
        }
    }

}
