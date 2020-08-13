import {ILivechatRoom} from '@rocket.chat/apps-engine/definition/livechat';
import Room from '../../domain/Room';

export default interface ILiveChatCacheDataSource {

    getRoomByVisitorToken(token: string): Promise<Room | undefined>;

    saveRoom(room: Room): Promise<void>;

    deleteRoom(room: ILivechatRoom): Promise<void>;

    getNewVisitorUsername(): Promise<string>;

}
