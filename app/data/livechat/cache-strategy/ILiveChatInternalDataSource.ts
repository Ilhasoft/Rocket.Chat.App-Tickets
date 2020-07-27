import { ILivechatRoom, IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';

import Department from '../../../domain/Department';

export default interface ILiveChatInternalDataSource {

    sendMessage(text: string, attachments: Array<IMessageAttachment>, room: ILivechatRoom): Promise<string>;

    closeRoom(room: ILivechatRoom, comment: string): Promise<void>;

    createRoom(visitor: IVisitor): Promise<ILivechatRoom>;

    createVisitor(visitor: IVisitor): Promise<IVisitor>;

    getDepartmentByName(name: string): Promise<Department | undefined>;

    getVisitorByToken(token: string): Promise<IVisitor | undefined>;

}
