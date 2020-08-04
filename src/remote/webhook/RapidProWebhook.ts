import { IHttp, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';

import IWebhookRepository from '../../data/webhook/IWebhookRepository';
import Room from '../../domain/Room';
import { RC_SERVER_URL } from '../../settings/Constants';

export default class RapidProWebhook implements IWebhookRepository {

    constructor(
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly baseCallbackUrl: string,
        private readonly secret: string,
    ) { }

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

        await this.http.post(this.baseCallbackUrl, reqOptions);
    }

    public async sendAgentMessage(room: Room, text?: string, attachments?: Array<IMessageAttachment>): Promise<void> {
        const payload = {
            type: 'agent-message',
            ticketId: room.ticketId,
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
            const formattedAttachments: { [key: string]: any } = [];
            await Promise.all(attachments.map(async (attachment) => {
                let type = this.getAttachmentType(attachment);
                const url = await this.buildAttachmentUrl(attachment);
                if (type === 'document') {
                    if (url.endsWith('.pdf')) {
                        type = type.concat('/pdf');
                        formattedAttachments.push({ type, url });
                    }
                } else {
                    formattedAttachments.push({type, url});
                }
            }));
            if (formattedAttachments.length === 0) {
                return;
            }
            payload.data['attachments'] = formattedAttachments;
        }

        const reqOptions = this.requestOptions();
        reqOptions['data'] = payload;

        await this.http.post(this.baseCallbackUrl, reqOptions);
    }

    private requestOptions(): object {
        return {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${this.secret}`,
            },
        };
    }

    private getAttachmentType(attachment: IMessageAttachment): string {
        return attachment['videoType'] || attachment['audioType'] || attachment['imageType'] || 'document';
    }

    private async buildAttachmentUrl(attachment: IMessageAttachment): Promise<string> {

        const siteUrl = await this.read.getEnvironmentReader().getServerSettings().getValueById(RC_SERVER_URL);
        return `${siteUrl}${attachment.title!.link}`;

    }

}
