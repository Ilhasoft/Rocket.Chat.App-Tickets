import Department from '../../../domain/Department';
import Visitor from '../../../domain/Visitor';

export default interface ILiveChatCacheDataSource {

    getDepartments(): Promise<Array<Department>>;

    saveDepartments(departments: Array<Department>): Promise<number>;

    getVisitor(token: string): Promise<Visitor | undefined>;

    saveVisitor(visitor: Visitor): Promise<void>;

    deleteVisitor(visitor: Visitor): Promise<void>;

    closeRoom(visitor: Visitor): Promise<void>;

}
