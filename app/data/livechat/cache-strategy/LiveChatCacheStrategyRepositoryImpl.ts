import { HttpStatusCode } from '@rocket.chat/apps-engine/definition/accessors';
import { ILivechatRoom, IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import AppError from '../../../domain/AppError';
import Department from '../../../domain/Department';
import ILiveChatRepository from '../ILiveChatRepository';
import ILiveChatCacheDataSource from './ILiveChatCacheDataSource';
import ILiveChatInternalDataSource from './ILiveChatInternalDataSource';
import ILiveChatRemoteDataSource from './ILiveChatRemoteDataSource';

export default class LiveChatCacheStrategyRepositoryImpl implements ILiveChatRepository {

    constructor(
        private readonly cacheDataSource: ILiveChatCacheDataSource,
        private readonly remoteDataSource: ILiveChatRemoteDataSource,
        private readonly internalDataSource: ILiveChatInternalDataSource,
    ) {
    }

    public async getDepartments(): Promise<Array<Department>> {
        const cache = await this.cacheDataSource.getDepartments();

        if (cache.length > 0) {
            return cache;
        }
        const departments = await this.remoteDataSource.getDepartments();
        await this.cacheDataSource.saveDepartments(departments);

        return departments;
    }

    public async getDepartmentByName(name: string): Promise<Department | undefined> {
        const departments = await this.getDepartments();
        return departments.find((d) => d.name === name);
    }

    public async createVisitor(visitor: IVisitor): Promise<IVisitor> {
        return await this.remoteDataSource.createVisitor(visitor);
    }

    public async getRoomByVisitor(token: string): Promise<ILivechatRoom | undefined> {
        return await this.cacheDataSource.getRoomByVisitor(token);
    }

    public async createRoom(visitor: IVisitor): Promise<ILivechatRoom> {
        const cache = await this.cacheDataSource.getRoomByVisitor(visitor.token);
        if (cache) {
            throw new AppError(`Visitor already exists`, HttpStatusCode.BAD_REQUEST);
        }
        const room = await this.remoteDataSource.createRoom(visitor);
        await this.cacheDataSource.saveRoom(room);
        return room;
    }

    public async closeRoom(room: ILivechatRoom): Promise<void> {
        const cache = await this.cacheDataSource.getRoomByVisitor(room.visitor.token);
        if (cache) {
            await this.cacheDataSource.deleteRoom(room);
        }
    }

    public async sendMessage(text: string, attachments: Array<IMessageAttachment>, room: ILivechatRoom): Promise<void> {
        await this.internalDataSource.sendMessage(text, attachments, room);
    }

}
