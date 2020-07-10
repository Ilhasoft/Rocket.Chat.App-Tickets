import { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';

export default interface IRapidProRemoteDataSource {

    startFlow(uuid: string, visitor: IVisitor, extra: any): Promise<void>;

}
