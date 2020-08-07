import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';

import Room from '../../domain/Room';

export default interface IWebhookRepository {

    onAgentMessage(room: Room, message?: string, attachments?: Array<IMessageAttachment>): Promise<void>;

    onCloseRoom(room: Room): Promise<void>;

}
