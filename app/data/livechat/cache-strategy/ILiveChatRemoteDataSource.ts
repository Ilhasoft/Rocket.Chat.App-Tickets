import { ILivechatRoom, IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import Department from '../../../domain/Department';

export default interface ILiveChatRemoteDataSource {

    getDepartments(): Promise<Array<Department>>;

    createVisitor(visitor: IVisitor): Promise<IVisitor>;

    createRoom(visitor: IVisitor): Promise<ILivechatRoom>;

}
