import {IMessageAttachment} from '@rocket.chat/apps-engine/definition/messages';

export default class AttachmentUtils {

    public static getType(attachment: IMessageAttachment): string {
        return attachment['imageType'] || attachment['videoType'] || attachment['audioType'] || 'document';
    }

    public static getUrl(serverUrl, attachment: IMessageAttachment): string {
        return `${serverUrl}${attachment.title!.link}`;
    }

}
