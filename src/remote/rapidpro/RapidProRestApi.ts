import { HttpStatusCode, IHttp } from '@rocket.chat/apps-engine/definition/accessors';
import { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';

import IRapidProRemoteDataSource from '../../data/rapidpro/IRapidProRemoteDataSource';
import RPMessage from '../../domain/RPMessage';
import DateStringUtils from '../../utils/DateStringUtils';

export default class RapidProRestApi implements IRapidProRemoteDataSource {

    constructor(
        private readonly http: IHttp,
        private readonly baseUrl: string,
        private readonly authToken: string,
        private readonly timeout: number,
    ) {
        this.timeout = this.timeout < 5 ? 5 : this.timeout;
    }

    public async getMessages(contactUUID: string, after: string, defaultTimezone: number): Promise<Array<RPMessage>> {
        const reqOptions = this.requestOptions();
        reqOptions['params'] = { contact: contactUUID, after };

        const response = await this.http.get(this.baseUrl + '/api/v2/messages.json', reqOptions);
        if (!response || response.statusCode !== HttpStatusCode.OK) {
            return [];
        }

        const tzOffset = defaultTimezone ? defaultTimezone * 60 : DateStringUtils.getTimezoneOffsetInMinutes(after);

        const result: Array<RPMessage> = [];

        response.data.results.forEach((message) => {
            if (message.status !== 'errored') {
                const date = message.sent_on ?? message.created_on;
                const sentOn = DateStringUtils.format(DateStringUtils.addMinutes(date, tzOffset), 'dd/MM/yyyy, hh:mm');

                message.text && result.push({ direction: message.direction, sentOn, text: message.text } as RPMessage);
                message.attachments.forEach((attachment) => {
                    result.push({ direction: message.direction, sentOn, text: attachment.url } as RPMessage);
                });
            }
        });

        return result;
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
            timeout: this.timeout * 1000,
        };
    }

}
