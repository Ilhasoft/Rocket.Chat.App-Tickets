import { ILivechatRoom, IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import Department from '../../domain/Department';

export default interface ILiveChatRepository {

    getDepartments(): Promise<Array<Department>>;

    getDepartmentByName(name: string): Promise<Department | undefined>;

    createVisitor(visitor: IVisitor): Promise<IVisitor>;

    getRoomByVisitorToken(token: string): Promise<ILivechatRoom | undefined>;

    createRoom(visitor: IVisitor): Promise<ILivechatRoom>;

    closeRoom(room: ILivechatRoom): Promise<void>;

    sendMessage(text: string, attachments: Array<IMessageAttachment>, room: ILivechatRoom);

}
