import {HttpStatusCode} from '@rocket.chat/apps-engine/definition/accessors';

export default interface ApiResponse<T> {

    readonly data: T;
    readonly statusCode: HttpStatusCode;

}
