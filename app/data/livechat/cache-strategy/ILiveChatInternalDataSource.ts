import { ILivechatRoom, IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import Department from '../../../domain/Department';
import Room from '../../../domain/Room';

export default interface ILiveChatInternalDataSource {

    sendMessage(text: string, attachments: Array<IMessageAttachment>, room: ILivechatRoom): Promise<void>;

    closeRoom(room: ILivechatRoom, comment: string): Promise<void>;

    createRoom(visitor: IVisitor): Promise<ILivechatRoom>;

    getDepartmentByName(name: string): Promise<Department | undefined>;

}
