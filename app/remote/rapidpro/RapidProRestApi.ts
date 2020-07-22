import { IHttp } from '@rocket.chat/apps-engine/definition/accessors';
import { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';

import IRapidProRemoteDataSource from '../../data/rapidpro/IRapidProRemoteDataSource';

export default class RapidProRestApi implements IRapidProRemoteDataSource {

    constructor(
        private readonly http: IHttp,
        private readonly baseUrl: string,
        private readonly authToken: string,
        private readonly timeout: number,
    ) {
        this.timeout = this.timeout < 5 ? 5 : this.timeout;
    }

    public async startFlow(uuid: string, visitor: IVisitor, extra: any): Promise<void> {
        const payload = {
            flow: uuid,
            contacts: [visitor.token],
            restart_participants: true,
            params: extra,
        };
        const reqOptions = this.requestOptions();
        reqOptions['data'] = payload;

        await this.http.post(this.baseUrl + '/api/v2/flow_starts.json', reqOptions);
    }

    private requestOptions(): object {
        return {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${this.authToken}`,
            },
            // TODO: check timeout parameter
            // timeout: this.timeout,
        };
    }

}
