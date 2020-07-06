import { HttpStatusCode } from '@rocket.chat/apps-engine/definition/accessors';
import AppError from '../../../domain/AppError';
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
            return cache;
        }
        const departments = await this.remoteDataSource.getDepartments();
        await this.cacheDataSource.saveDepartments(departments);

        return  departments;
    }

    public async getDepartmentByName(name: string): Promise<Department | undefined> {
        const departments = await this.getDepartments();
        return departments.find((d) => d.name === name);
    }

    public async createVisitor(visitor: Visitor): Promise<Visitor> {
        return await this.remoteDataSource.createVisitor(visitor);
    }

    public async createRoom(visitor: Visitor): Promise<Room> {
        const cache = await this.cacheDataSource.getVisitor(visitor.token);
        if (cache) {
            throw new AppError(`Visitor already exists`, HttpStatusCode.BAD_REQUEST);
        }
        const room = await this.remoteDataSource.createRoom(visitor);
        await this.cacheDataSource.saveVisitor(visitor);
        return room;
    }

    public async closeRoom(visitor: Visitor): Promise<void> {
        const cache = await this.cacheDataSource.getVisitor(visitor.token);
        if (cache) {
            await this.cacheDataSource.deleteVisitor(visitor);
        }
    }

}
