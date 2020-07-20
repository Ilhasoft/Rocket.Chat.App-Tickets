import { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';

export default interface Room {

    readonly ticketId: string;
    readonly contactUuid: string;
    readonly room: ILivechatRoom;

}
