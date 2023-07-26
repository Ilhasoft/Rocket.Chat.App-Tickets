import {IVisitor} from '@rocket.chat/apps-engine/definition/livechat';
import RPMessage from '../../domain/RPMessage';

export default interface IRapidProRemoteDataSource {

    getMessages(contactUUID: string, after: string, defaultTimezone: number): Promise<Array<RPMessage>>;

    startFlow(uuid: string, visitor: IVisitor, extra: any): Promise<void>;

}
