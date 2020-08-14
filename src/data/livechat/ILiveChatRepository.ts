import {ILivechatRoom, IVisitor} from '@rocket.chat/apps-engine/definition/livechat';

import {IMessageAttachment} from '@rocket.chat/apps-engine/definition/messages';
import Department from '../../domain/Department';
import Room from '../../domain/Room';
import RPMessage from '../../domain/RPMessage';
import Visitor from '../../domain/Visitor';

export default interface ILiveChatRepository {

    getDepartmentByName(name: string): Promise<Department | undefined>;

    createVisitor(visitor: IVisitor): Promise<Visitor>;

    getRoomByVisitorToken(token: string): Promise<Room>;

    createRoom(ticketID: string, contactUUID: string, visitor: IVisitor): Promise<ILivechatRoom>;

    eventCloseRoom(room: Room): Promise<boolean>;

    endpointCloseRoom(visitorToken: string): Promise<void>;

    sendAgentMessage(room: Room, message?: string, attachments?: Array<IMessageAttachment>): Promise<void>;

    sendVisitorMessage(text: string, room: Room): Promise<string>;

    sendChatbotHistory(messages: Array<RPMessage>, room: ILivechatRoom): Promise<string>;

}
