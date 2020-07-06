import Department from '../../domain/Department';
import Room from '../../domain/Room';
import Visitor from '../../domain/Visitor';

export default interface ILiveChatRepository {

    getDepartments(): Promise<Array<Department>>;

    getDepartmentByName(name: string): Promise<Department | undefined>;

    createVisitor(visitor: Visitor): Promise<Visitor>;

    createRoom(visitor: Visitor): Promise<Room>;

    closeRoom(visitor: Visitor): Promise<void>;

}
