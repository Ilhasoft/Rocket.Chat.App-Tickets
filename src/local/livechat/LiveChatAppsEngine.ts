import {ILivechatRead, IModify} from '@rocket.chat/apps-engine/definition/accessors';
import {ILivechatRoom, IVisitor} from '@rocket.chat/apps-engine/definition/livechat';
import {IUser} from '@rocket.chat/apps-engine/definition/users';

import ILiveChatInternalDataSource from '../../data/livechat/ILiveChatInternalDataSource';
import Department from '../../domain/Department';

export default class LiveChatAppsEngine implements ILiveChatInternalDataSource {

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
        return visitor;
    }

    public async createRoom(visitor: IVisitor) {
        return await this.modify.getCreator().getLivechatCreator().createRoom(visitor, {} as IUser);
    }

    public async closeRoom(room: ILivechatRoom): Promise<void> {
        await this.modify.getUpdater().getLivechatUpdater().closeRoom(room, '');
    }

    public async sendMessage(text: string, room: ILivechatRoom): Promise<string> {
        const livechatMessageBuilder = this.modify.getCreator().startLivechatMessage()
            .setRoom(room)
            .setVisitor(room.visitor)
            .setText(text);

        return await this.modify.getCreator().finish(livechatMessageBuilder);
    }

}
