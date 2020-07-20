import { HttpStatusCode } from '@rocket.chat/apps-engine/definition/accessors';
import { ILivechatRoom, IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import AppError from '../../../domain/AppError';
import Department from '../../../domain/Department';
import Visitor from '../../../domain/Visitor';
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

    public async createVisitor(visitor: IVisitor): Promise<Visitor> {
        // Check if department is a valid one
        let department: Department | undefined;
        if (visitor.department) {
            department = await this.getDepartmentByName(visitor.department);
            if (!department) {
                throw new AppError(`Could not find department with name: ${visitor.department}`, HttpStatusCode.BAD_REQUEST);
            }
        }
        const v = await this.remoteDataSource.createVisitor(visitor);
        return {
            visitor: v,
            department,
        } as Visitor;
    }

    public async getRoomByVisitorToken(token: string): Promise<ILivechatRoom | undefined> {
        return await this.cacheDataSource.getRoomByVisitorToken(token);
    }

    public async createRoom(visitor: IVisitor, department?: Department): Promise<ILivechatRoom> {
        const cache = await this.cacheDataSource.getRoomByVisitorToken(visitor.token);
        if (cache) {
            throw new AppError(`Visitor already exists`, HttpStatusCode.BAD_REQUEST);
        }
        const room = await this.remoteDataSource.createRoom(visitor, department);
        await this.cacheDataSource.saveRoom(room);
        return room;
    }

    public async endpointCloseRoom(room: ILivechatRoom, comment: string): Promise<void> {
        const cache = await this.cacheDataSource.getRoomByVisitorToken(room.visitor.token);
        if (cache) {
            await this.internalDataSource.closeRoom(room, comment);
        }
    }

    public async eventCloseRoom(room: ILivechatRoom): Promise<void> {
        await this.cacheDataSource.deleteRoom(room);
    }

    public async sendMessage(text: string, attachments: Array<IMessageAttachment>, room: ILivechatRoom): Promise<void> {
        await this.internalDataSource.sendMessage(text, attachments, room);
    }

}
