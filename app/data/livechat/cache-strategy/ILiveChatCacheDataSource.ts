import { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import Department from '../../../domain/Department';

export default interface ILiveChatCacheDataSource {

    getDepartments(): Promise<Array<Department>>;

    saveDepartments(departments: Array<Department>): Promise<number>;

    getRoomByVisitor(token: string): Promise<ILivechatRoom | undefined>;

    saveRoom(room: ILivechatRoom): Promise<void>;

    deleteRoom(room: ILivechatRoom): Promise<void>;

}
