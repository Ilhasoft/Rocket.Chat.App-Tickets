import { ILivechatRead, IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { ILivechatRoom, IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import ILiveChatInternalDataSource from '../../../data/livechat/cache-strategy/ILiveChatInternalDataSource';
import Department from '../../../domain/Department';

export default class LiveChatInternalHandler implements ILiveChatInternalDataSource {

    constructor(
        private readonly modify: IModify,
        private readonly livechatReader: ILivechatRead,
    ) {
    }

    public async closeRoom(room: ILivechatRoom, comment: string): Promise<void> {
        await this.modify.getUpdater().getLivechatUpdater().closeRoom(room, comment);
    }

    public async createRoom(visitor: IVisitor) {
        const room = await this.modify.getCreator().getLivechatCreator().createRoom(visitor, {} as IUser);
        return room;
    }

    public async createVisitor(visitor: IVisitor): Promise<IVisitor> {
        const id = await this.modify.getCreator().getLivechatCreator().createVisitor(visitor);
        visitor.id = id;
        return visitor;
    }

    public async getDepartmentByName(name: string): Promise<Department | undefined> {
        const department = await this.livechatReader.getLivechatDepartmentByIdOrName(name);
        return department as Department;
    }

    public async sendMessage(text: string, attachments: Array<IMessageAttachment>, room: ILivechatRoom): Promise<string> {
        const livechatMessageBuilder = this.modify.getCreator().startLivechatMessage()
            .setRoom(room)
            .setVisitor(room.visitor);
        if (text) {
            livechatMessageBuilder.setText(text);
        }
        // TODO: else to handle attachments
        const messageId = await this.modify.getCreator().finish(livechatMessageBuilder);
        return messageId;
    }

    public async getVisitorByToken(token: string): Promise<IVisitor | undefined> {
        const visitor = await this.livechatReader.getLivechatVisitorByToken(token);
        return visitor;
    }

}
