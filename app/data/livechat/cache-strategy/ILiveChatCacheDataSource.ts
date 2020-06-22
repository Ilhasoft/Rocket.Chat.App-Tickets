import Department from '../../../domain/Department';

export default interface ILiveChatCacheDataSource {

    getDepartments(): Promise<Array<Department>>;

    saveDepartments(departments: Array<Department>): Promise<number>;

}
