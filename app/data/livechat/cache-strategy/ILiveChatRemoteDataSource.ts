import { ILivechatRoom, IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import Department from '../../../domain/Department';

export default interface ILiveChatRemoteDataSource {

    createVisitor(visitor: IVisitor): Promise<IVisitor>;

    createRoom(visitor: IVisitor): Promise<ILivechatRoom>;

}
