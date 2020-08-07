import { HttpStatusCode, IRead } from '@rocket.chat/apps-engine/definition/accessors';

import AppError from '../domain/AppError';
import { CONFIG_APP_SECRET } from '../settings/Constants';

export default class RequestHeadersValidator {

    public static async validate(read: IRead, headers: {[key: string]: string}, checkContentType: boolean = true) {
        if (checkContentType && headers['content-type'] !== 'application/json') {
            throw new AppError('Invalid Content-Type header', HttpStatusCode.BAD_REQUEST);
        }

        let secret = await read.getEnvironmentReader().getSettings().getValueById(CONFIG_APP_SECRET);
        secret = secret.trim();

        if (!secret) {
            throw new AppError('Secret not set', HttpStatusCode.FORBIDDEN);
        }

        secret = `Token ${secret}`;
        if (headers.authorization !== secret) {
            throw new AppError('Invalid Authorization header', HttpStatusCode.FORBIDDEN);
        }
    }

}
