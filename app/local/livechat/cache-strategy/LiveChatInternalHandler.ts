import { IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import ILiveChatInternalDataSource from '../../../data/livechat/cache-strategy/ILiveChatInternalDataSource';

export default class LiveChatInternalHandler implements ILiveChatInternalDataSource {

    constructor(
        private readonly modify: IModify,
    ) {
    }

    public async sendMessage(text: string, attachments: Array<IMessageAttachment>, room: ILivechatRoom) {
        const livechatMessageBuilder = await this.modify.getCreator().startLivechatMessage()
            .setRoom(room)
            .setVisitor(room.visitor);
        if (text) {
            livechatMessageBuilder.setText(text);
        }
        // TODO: else to handle attachments
        await this.modify.getCreator().finish(livechatMessageBuilder);
    }

}
