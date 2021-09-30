import { ILivechatRead, IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { ILivechatRoom, IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import ILivechatInternalDataSource from '../../data/livechat/ILivechatInternalDataSource';
import Attachment from '../../domain/Attachment';
import Department from '../../domain/Department';

export default class LiveChatAppsEngine implements ILivechatInternalDataSource {

    constructor(
        private readonly modify: IModify,
        private readonly livechatReader: ILivechatRead,
    ) {
    }

    public async getDepartmentByName(name: string): Promise<Department | undefined> {
        const department = await this.livechatReader.getLivechatDepartmentByIdOrName(name);
        return department as Department;
    }

    public async getVisitorByToken(token: string): Promise<IVisitor | undefined> {
        return await this.livechatReader.getLivechatVisitorByToken(token);
    }

    public async createVisitor(visitor: IVisitor): Promise<IVisitor> {
        visitor.id = await this.modify.getCreator().getLivechatCreator().createVisitor(visitor);

        if (visitor.customFields) {
            const entries = Object.entries(visitor.customFields);
            entries.map(async (field) => {
                await this.modify.getUpdater().getLivechatUpdater().setCustomFields(visitor.token, field[0], field[1], true);
            });
        }

        return visitor;
    }

    public async createRoom(visitor: IVisitor) {
        return await this.modify.getCreator().getLivechatCreator().createRoom(visitor, {} as IUser);
    }

    public async closeRoom(room: ILivechatRoom): Promise<void> {
        await this.modify.getUpdater().getLivechatUpdater().closeRoom(room, '');
    }

    public async sendMessage(room: ILivechatRoom, text?: string, attachments?: Array<Attachment>): Promise<string> {
        const livechatMessageBuilder = this.modify.getCreator().startLivechatMessage()
            .setRoom(room)
            .setVisitor(room.visitor);

        text && livechatMessageBuilder.setText(text);

        if (attachments) {
            const messageAttachments: Array<IMessageAttachment> = [];
            attachments.map((attachment) => {
                switch (attachment.type.split('/')[0]) {
                    case 'image':
                        messageAttachments.push({ imageUrl: attachment.url });
                        break;
                    // case 'audio':
                    //     messageAttachments.push({ audioUrl: attachment.url });
                    //     break;
                    case 'video':
                        messageAttachments.push({ videoUrl: attachment.url });
                        break;
                    default: // TODO: wait for appsEngine support the creation of documents attachments
                        if (text) {
                            livechatMessageBuilder.setText(`${text}\n${attachment.url}`);
                        } else {
                            livechatMessageBuilder.setText(attachment.url);
                        }

                }
            });
            livechatMessageBuilder.setAttachments(messageAttachments);
        }

        return await this.modify.getCreator().finish(livechatMessageBuilder);
    }

}
