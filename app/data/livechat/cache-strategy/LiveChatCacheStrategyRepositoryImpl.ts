import Department from '../../../domain/Department';
import Room from '../../../domain/Room';
import Visitor from '../../../domain/Visitor';
import ILiveChatRepository from '../ILiveChatRepository';
import ILiveChatCacheDataSource from './ILiveChatCacheDataSource';
import ILiveChatRemoteDataSource from './ILiveChatRemoteDataSource';

export default class LiveChatCacheStrategyRepositoryImpl implements ILiveChatRepository {

    constructor(
        private readonly cacheDataSource: ILiveChatCacheDataSource,
        private readonly remoteDataSource: ILiveChatRemoteDataSource,
    ) {
    }

    public async getDepartments(): Promise<Array<Department>> {
        const cache = await this.cacheDataSource.getDepartments();

        if (cache.length > 0) {
            return Promise.resolve(cache);
        }
        const departments = await this.remoteDataSource.getDepartments();
        await this.cacheDataSource.saveDepartments(departments);

        return Promise.resolve(departments);
    }

    public async getDepartmentByName(name: string): Promise<Department | undefined> {
        const departments = await this.getDepartments();
        const found = departments.find((d) => d.name === name);

        return Promise.resolve(found);
    }

    public createVisitor(visitor: Visitor): Promise<string> {
        return this.remoteDataSource.createVisitor(visitor);
    }

    public createRoom(visitor: Visitor): Promise<Room> {
        return this.remoteDataSource.createRoom(visitor);
    }

}
