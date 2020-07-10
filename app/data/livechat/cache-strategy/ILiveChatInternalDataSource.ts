import { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';

export default interface ILiveChatInternalDataSource {

    sendMessage(text: string, attachments: Array<IMessageAttachment>, room: ILivechatRoom): Promise<void>;

    closeRoom(room: ILivechatRoom, comment: string): Promise<void>;

}
