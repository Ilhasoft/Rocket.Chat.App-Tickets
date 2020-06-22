import Department from '../../domain/Department';
import Room from '../../domain/Room';
import Visitor from '../../domain/Visitor';

export default interface ILiveChatRepository {

    getDepartments(): Promise<Array<Department>>;

    getDepartmentByName(name: string): Promise<Department | undefined>;

    createVisitor(visitor: Visitor): Promise<string>;

    createRoom(visitor: Visitor, department?: Department): Promise<Room>;

}
