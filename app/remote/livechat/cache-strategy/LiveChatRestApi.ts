import {IHttp} from '@rocket.chat/apps-engine/definition/accessors';
import ILiveChatRemoteDataSource from '../../../data/livechat/cache-strategy/ILiveChatRemoteDataSource';
import Department from '../../../domain/Department';
import Room from '../../../domain/Room';
import Visitor from '../../../domain/Visitor';
import LiveChatCredentials from './LiveChatCredentials';

export default class LiveChatRestApi implements ILiveChatRemoteDataSource {

    constructor(
        private readonly http: IHttp,
        private readonly baseUrl: string,
        private readonly credentials: LiveChatCredentials,
        private readonly timeout: number,
    ) {
        this.timeout = this.timeout < 5 ? 5 : this.timeout;
    }

    public async getDepartments(): Promise<Array<Department>> {
        const res = await this.http.get(this.baseUrl + '/api/v1/livechat/department', this.requestOptions());
        const resBody = this.checkResponseBody(res.content);

        if (res.statusCode !== 200 || !resBody) {
            return Promise.reject('Error retrieving departments');
        }
        return Promise.resolve((resBody['departments'] as Array<object>).map((o) => {
            return new Department(o['_id'], o['name']);
        }));
    }

    public async createVisitor(visitor: Visitor): Promise<string> {
        const payload = {
            visitor: {
                token: visitor.token,
                department: visitor.departmentId,
                name: visitor.name,
                email: visitor.email,
                phone: visitor.phoneNumber,
                customFields: [] as Array<object>,
            },
        };
        for (const k of visitor.customFields.keys()) {
            payload.visitor.customFields.push({
                key: k,
                value: visitor.customFields.get(k),
                overwrite: true,
            });
        }
        const reqOptions = this.requestOptions();
        reqOptions['content'] = JSON.stringify(payload);

        const res = await this.http.post(this.baseUrl + '/api/v1/livechat/visitor', reqOptions);
        const resBody = this.checkResponseBody(res.content);

        if (res.statusCode !== 200 || !resBody) {
            return Promise.reject('Error creating visitor');
        }
        return Promise.resolve(resBody['_id']);
    }

    public async createRoom(visitor: Visitor, department?: Department): Promise<Room> {
        const payload = {token: visitor.token};
        const reqOptions = this.requestOptions();
        reqOptions['params'] = payload;

        const res = await this.http.get(this.baseUrl + '/api/v1/livechat/room', reqOptions);
        const resBody = this.checkResponseBody(res.content);

        if (res.statusCode !== 200 || !resBody) {
            return Promise.reject('Error getting or creating room');
        }
        return Promise.resolve(resBody['_id']);
    }

    private requestOptions(): object {
        return {
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': this.credentials.authToken,
                'X-User-Id': this.credentials.userId,
            },
            timeout: this.timeout,
        };
    }

    private checkResponseBody(body?: string): object | undefined {
        if (!body) {
            return undefined;
        }
        const parse = JSON.parse(body);
        return parse.success ? parse : undefined;
    }

}
