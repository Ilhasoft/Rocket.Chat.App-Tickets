import { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import Department from './Department';

export default interface Visitor {

    readonly visitor: IVisitor;
    readonly department?: Department;

}
