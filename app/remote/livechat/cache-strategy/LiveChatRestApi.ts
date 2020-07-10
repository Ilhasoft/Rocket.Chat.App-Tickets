import {IHttp} from '@rocket.chat/apps-engine/definition/accessors';
import { ILivechatRoom, IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import ILiveChatRemoteDataSource from '../../../data/livechat/cache-strategy/ILiveChatRemoteDataSource';
import AppError from '../../../domain/AppError';
import Department from '../../../domain/Department';
import ILiveChatCredentials from './ILiveChatCredentials';

export default class LiveChatRestApi implements ILiveChatRemoteDataSource {

    constructor(
        private readonly http: IHttp,
        private readonly baseUrl: string,
        private readonly credentials: ILiveChatCredentials,
        private readonly timeout: number,
    ) {
        this.timeout = this.timeout < 5 ? 5 : this.timeout;
    }

    public async getDepartments(): Promise<Array<Department>> {
        const res = await this.http.get(this.baseUrl + '/api/v1/livechat/department', this.requestOptions());
        const resBody = this.checkResponseBody(res.content);

        if (res.statusCode !== 200 || !resBody) {
            throw new AppError('Error retrieving departments', res.statusCode);
        }

        const departments = (resBody['departments'] as Array<object>).map((o) => {
            return { id: o['_id'], name: o['name'] } as Department;
        });

        return departments;
    }

    public async createVisitor(visitor: IVisitor): Promise<IVisitor> {
        const payload = {
            visitor,
        };
        const reqOptions = this.requestOptions();
        reqOptions['content'] = JSON.stringify(payload);

        const res = await this.http.post(this.baseUrl + '/api/v1/livechat/visitor', reqOptions);
        const resBody = this.checkResponseBody(res.content);

        if (res.statusCode !== 200 || !resBody) {
            throw new AppError('Error creating visitor', res.statusCode);
        }

        visitor.id = resBody['visitor']._id;
        return visitor;
    }

    public async createRoom(visitor: IVisitor, department: Department): Promise<ILivechatRoom> {
        const payload = {token: visitor.token};
        const reqOptions = this.requestOptions();
        reqOptions['params'] = payload;

        const res = await this.http.get(this.baseUrl + '/api/v1/livechat/room', reqOptions);
        const resBody = this.checkResponseBody(res.content);

        if (res.statusCode !== 200 || !resBody) {
            throw new AppError('Error getting or creating room', res.statusCode);
        }

        const resRoom = resBody['room'];
        const servedBy = resRoom.servedBy;
        servedBy.id = resRoom.servedBy._id;
        const livechatRoom = {
            visitor,
            department,
            servedBy,
            isWaitingResponse: resRoom.waitingResponse,
            isOpen: resRoom.open,
            type: resRoom.t,
            id: resRoom._id,
        } as ILivechatRoom;

        return livechatRoom;
    }

    private requestOptions(): object {
        return {
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': this.credentials.authToken,
                'X-User-Id': this.credentials.userId,
            },
            // TODO: check timeout parameter
            // timeout: this.timeout,
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
