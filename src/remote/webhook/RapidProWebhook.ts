import {IHttp, IRead} from '@rocket.chat/apps-engine/definition/accessors';
import {IMessageAttachment} from '@rocket.chat/apps-engine/definition/messages';

import IWebhookRepository from '../../data/webhook/IWebhookRepository';
import Room from '../../domain/Room';
import {RC_SERVER_URL} from '../../settings/Constants';
import AttachmentUtils from '../../utils/AttachmentUtils';

export default class RapidProWebhook implements IWebhookRepository {

    constructor(
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly callbackUrl: string,
        private readonly secret: string,
    ) {
    }

    public async onAgentMessage(room: Room, text?: string, attachments?: Array<IMessageAttachment>): Promise<void> {
        const payload = {
            type: 'agent-message',
            ticketID: room.ticketID,
            visitor: {
                token: room.room.visitor.token,
            },
            data: {
                agent: {
                    id: room.room.servedBy!.id,
                },
                text,
            },
        };

        if (attachments) {
            const attachmentsPayload: { [key: string]: any } = [];
            const serverUrl = await this.read.getEnvironmentReader().getServerSettings().getValueById(RC_SERVER_URL);

            attachments.forEach((attachment) => {
                const url = AttachmentUtils.getUrl(serverUrl, attachment);
                let type = AttachmentUtils.getType(attachment);

                if (type === 'document') {
                    if (url.endsWith('.pdf')) {
                        type += '/pdf';
                        attachmentsPayload.push({type, url});
                    }
                } else {
                    attachmentsPayload.push({type, url});
                }
                if (attachmentsPayload.length === 0) {
                    return;
                }
                payload.data['attachments'] = attachmentsPayload;
            });
        }

        const reqOptions = this.requestOptions();
        reqOptions['data'] = payload;

        await this.http.post(this.callbackUrl, reqOptions);
    }

    public async onCloseRoom(room: Room): Promise<void> {
        const payload = {
            type: 'close-room',
            ticketID: room.ticketID,
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

        await this.http.post(this.callbackUrl, reqOptions);
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
