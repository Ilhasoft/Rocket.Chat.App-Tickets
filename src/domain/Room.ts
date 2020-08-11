import { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';

export default interface Room {

    readonly ticketID: string;
    readonly contactUUID: string;
    readonly room: ILivechatRoom;
    closed: boolean;

}
