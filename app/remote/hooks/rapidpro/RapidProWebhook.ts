import { IHttp } from '@rocket.chat/apps-engine/definition/accessors';
import { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import IWebhookRepository from '../../../data/hooks/rapidpro/IWebhookRepository';

export default class RapidProWebhook implements IWebhookRepository {

    constructor(
        private readonly http: IHttp,
        private readonly baseCallbackUrl: string,
        private readonly secret: string,
    ) {}

    public async onCloseRoom(agent: IUser, visitor: IVisitor): Promise<void> {
        console.log('on close');
        const payload = {
            type: 'close',
            data: {
                agent: {
                    id: agent.id,
                },
                visitor: {
                    token: visitor.token,
                },
            },
        };
        const reqOptions = this.requestOptions();
        reqOptions['data'] = payload;

        await this.http.post(this.baseCallbackUrl + '/closeRoom', reqOptions);
    }

    private requestOptions(): object {
        return {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${this.secret}`,
            },
        };
    }

}
