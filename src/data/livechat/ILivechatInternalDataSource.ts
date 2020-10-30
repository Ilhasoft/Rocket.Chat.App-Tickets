import {ILivechatRoom, IVisitor} from '@rocket.chat/apps-engine/definition/livechat';
import Attachment from '../../domain/Attachment';

import Department from '../../domain/Department';

export default interface ILivechatInternalDataSource {

    getDepartmentByName(name: string): Promise<Department | undefined>;

    getVisitorByToken(token: string): Promise<IVisitor | undefined>;

    createVisitor(visitor: IVisitor): Promise<IVisitor>;

    createRoom(visitor: IVisitor): Promise<ILivechatRoom>;

    closeRoom(room: ILivechatRoom): Promise<void>;

    sendMessage(room: ILivechatRoom, text?: string, attachments?: Array<Attachment>): Promise<string>;

}
