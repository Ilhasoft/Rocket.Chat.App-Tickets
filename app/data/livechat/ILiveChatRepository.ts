import { ILivechatRoom, IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import Department from '../../domain/Department';
import Room from '../../domain/Room';
import Visitor from '../../domain/Visitor';

export default interface ILiveChatRepository {

    getDepartmentByName(name: string): Promise<Department | undefined>;

    createVisitor(visitor: IVisitor): Promise<Visitor>;

    getRoomByVisitorToken(token: string): Promise<Room | undefined>;

    createRoom(ticketId: string, contactuuid: string, visitor: IVisitor): Promise<ILivechatRoom>;

    endpointCloseRoom(visitorToken: string, comment: string): Promise<void>;

    eventCloseRoom(room: ILivechatRoom): Promise<void>;

    sendMessage(text: string, attachments: Array<IMessageAttachment>, room: ILivechatRoom): Promise<void>;

}
