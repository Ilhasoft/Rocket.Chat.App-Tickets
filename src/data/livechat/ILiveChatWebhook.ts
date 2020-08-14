import {IMessageAttachment} from '@rocket.chat/apps-engine/definition/messages';
import Room from '../../domain/Room';

export default interface ILiveChatWebhook {

    onCloseRoom(room: Room): Promise<boolean>;

    onAgentMessage(room: Room, message?: string, attachments?: Array<IMessageAttachment>): Promise<void>;

}
