import { IHttp } from '@rocket.chat/apps-engine/definition/accessors';

import IWebhookRepository from '../../../data/hooks/rapidpro/IWebhookRepository';
import Room from '../../../domain/Room';

export default class RapidProWebhook implements IWebhookRepository {

    constructor(
        private readonly http: IHttp,
        private readonly baseCallbackUrl: string,
        private readonly secret: string,
    ) {}

    public async onCloseRoom(room: Room): Promise<void> {
        const payload = {
            type: 'close-room',
            ticketId: room.ticketId,
            visitor: {
                token: room.room.visitor.token,
            },
            data: {
                agent: {
                    id: room.room.servedBy!.id,
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
