import { HttpStatusCode } from '@rocket.chat/apps-engine/definition/accessors';
import { ILivechatRoom, IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';

import AppError from '../../../domain/AppError';
import Department from '../../../domain/Department';
import Room from '../../../domain/Room';
import Visitor from '../../../domain/Visitor';
import ILiveChatRepository from '../ILiveChatRepository';
import ILiveChatCacheDataSource from './ILiveChatCacheDataSource';
import ILiveChatInternalDataSource from './ILiveChatInternalDataSource';

export default class LiveChatCacheStrategyRepositoryImpl implements ILiveChatRepository {

    constructor(
        private readonly cacheDataSource: ILiveChatCacheDataSource,
        private readonly internalDataSource: ILiveChatInternalDataSource,
    ) {
    }

    public async getDepartmentByName(name: string): Promise<Department | undefined> {
        const department = await this.internalDataSource.getDepartmentByName(name);
        return department;
    }

    public async createVisitor(visitor: IVisitor): Promise<Visitor> {
        // Check if department is a valid one
        let department: Department | undefined;
        if (visitor.department) {
            department = await this.getDepartmentByName(visitor.department);
            if (!department) {
                throw new AppError(`Could not find department with name: ${visitor.department}`, HttpStatusCode.BAD_REQUEST);
            }
            visitor.department = department.id;
        }
        const v = await this.internalDataSource.createVisitor(visitor);
        return {
            visitor: v,
            department,
        } as Visitor;
    }

    public async getRoomByVisitorToken(token: string): Promise<Room | undefined> {
        return await this.cacheDataSource.getRoomByVisitorToken(token);
    }

    public async createRoom(ticketId: string, contactUuid: string, visitor: IVisitor): Promise<ILivechatRoom> {
        const cache = await this.cacheDataSource.getRoomByVisitorToken(visitor.token);
        if (cache) {
            throw new AppError(`Visitor already exists`, HttpStatusCode.BAD_REQUEST);
        }
        const room = await this.internalDataSource.createRoom(visitor);
        await this.cacheDataSource.saveRoom({ticketId, contactUuid, room} as Room);
        return room;
    }

    public async endpointCloseRoom(visitorToken: string, comment: string): Promise<void> {
        const cache = await this.cacheDataSource.getRoomByVisitorToken(visitorToken);
        if (!cache) {
            throw new AppError(`Could not find a room for the visitor with token: ${visitorToken}`, HttpStatusCode.BAD_REQUEST);
        }
        await this.internalDataSource.closeRoom(cache.room, comment);
    }

    public async eventCloseRoom(room: ILivechatRoom): Promise<void> {
        await this.cacheDataSource.deleteRoom(room);
    }

    public async sendMessage(text: string, attachments: Array<IMessageAttachment>, room: ILivechatRoom): Promise<void> {
        await this.internalDataSource.sendMessage(text, attachments, room);
    }

}
