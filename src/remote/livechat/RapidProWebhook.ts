import {HttpStatusCode, IHttp, IRead} from '@rocket.chat/apps-engine/definition/accessors';
import {IMessageAttachment} from '@rocket.chat/apps-engine/definition/messages';

import ILiveChatWebhook from '../../data/livechat/ILiveChatWebhook';
import Room from '../../domain/Room';
import {joypixels} from '../../lib/joypixels/6_0_0/joypixels';
import {RC_SERVER_URL} from '../../settings/Constants';
import AttachmentUtils from '../../utils/AttachmentUtils';

export default class RapidProWebhook implements ILiveChatWebhook {

    constructor(
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly callbackUrl: string,
        private readonly secret: string,
    ) {
    }

    public async onAgentMessage(room: Room, text?: string, attachments?: Array<IMessageAttachment>): Promise<void> {

        text = joypixels.shortnameToUnicode(text);

        const payload = {
            type: 'agent-message',
            ticketID: room.ticketID,
            visitor: {
                token: room.room.visitor.token,
            },
            data: {
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

    public async onCloseRoom(room: Room): Promise<boolean> {
        const payload = {
            type: 'close-room',
            ticketID: room.ticketID,
            visitor: {
                token: room.room.visitor.token,
            },
        };
        const reqOptions = this.requestOptions();
        reqOptions['data'] = payload;

        const response = await this.http.post(this.callbackUrl, reqOptions);
        return response && response.statusCode === HttpStatusCode.OK;
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
