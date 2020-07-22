import { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';

import Department from '../../../domain/Department';
import Room from '../../../domain/Room';

export default interface ILiveChatCacheDataSource {

    getDepartments(): Promise<Array<Department>>;

    saveDepartments(departments: Array<Department>): Promise<number>;

    getRoomByVisitorToken(token: string): Promise<Room | undefined>;

    saveRoom(room: Room): Promise<void>;

    deleteRoom(room: ILivechatRoom): Promise<void>;

}
