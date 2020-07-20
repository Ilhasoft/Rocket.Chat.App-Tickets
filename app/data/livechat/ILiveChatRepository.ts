import { ILivechatRoom, IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import Department from '../../domain/Department';
import Visitor from '../../domain/Visitor';

export default interface ILiveChatRepository {

    getDepartments(): Promise<Array<Department>>;

    getDepartmentByName(name: string): Promise<Department | undefined>;

    createVisitor(visitor: IVisitor): Promise<Visitor>;

    getRoomByVisitorToken(token: string): Promise<ILivechatRoom | undefined>;

    createRoom(visitor: IVisitor, department?: Department): Promise<ILivechatRoom>;

    endpointCloseRoom(room: ILivechatRoom, comment: string): Promise<void>;

    eventCloseRoom(room: ILivechatRoom): Promise<void>;

    sendMessage(text: string, attachments: Array<IMessageAttachment>, room: ILivechatRoom): Promise<void>;

}
