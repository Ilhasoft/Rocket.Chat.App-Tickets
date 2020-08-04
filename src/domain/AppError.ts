import { HttpStatusCode } from '@rocket.chat/apps-engine/definition/accessors';

export default class AppError extends Error {
    constructor(m: string, readonly statusCode: HttpStatusCode) {
        super(m);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
