import {HttpStatusCode} from '@rocket.chat/apps-engine/definition/accessors';
import AppError from '../domain/AppError';
import {validate} from '../lib/validatejs/0_13_1/validate';

export default class RequestBodyValidator {

    public static async validate(constraints, body) {
        const errors = validate(body, constraints);
        if (errors) {
            throw new AppError(JSON.stringify(errors), HttpStatusCode.BAD_REQUEST);
        }
    }

    public static async validateDateString(date: string) {
        if (date) {
            new Date(date).toISOString();
        }
    }

}
