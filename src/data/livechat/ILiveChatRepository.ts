import {ILivechatRoom, IVisitor} from '@rocket.chat/apps-engine/definition/livechat';

import Department from '../../domain/Department';
import Room from '../../domain/Room';
import Visitor from '../../domain/Visitor';

export default interface ILiveChatRepository {

    getDepartmentByName(name: string): Promise<Department | undefined>;

    createVisitor(visitor: IVisitor): Promise<Visitor>;

    getRoomByVisitorToken(token: string): Promise<Room>;

    createRoom(ticketID: string, contactUUID: string, visitor: IVisitor): Promise<ILivechatRoom>;

    eventCloseRoom(room: ILivechatRoom): Promise<void>;

    endpointCloseRoom(visitorToken: string): Promise<void>;

    sendMessage(text: string, room: ILivechatRoom): Promise<string>;

}
