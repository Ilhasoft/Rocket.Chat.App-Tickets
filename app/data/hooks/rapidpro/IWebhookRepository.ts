import { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

export default interface IWebhookRepository {

   onCloseRoom(agent: IUser, visitor: IVisitor): Promise<void>;

}
