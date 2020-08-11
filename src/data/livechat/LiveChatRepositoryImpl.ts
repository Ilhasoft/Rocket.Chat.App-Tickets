import {HttpStatusCode} from '@rocket.chat/apps-engine/definition/accessors';
import {ILivechatRoom, IVisitor} from '@rocket.chat/apps-engine/definition/livechat';

import AppError from '../../domain/AppError';
import Department from '../../domain/Department';
import Room from '../../domain/Room';
import RPMessage, {Direction} from '../../domain/RPMessage';
import Visitor from '../../domain/Visitor';
import ILiveChatCacheDataSource from './ILiveChatCacheDataSource';
import ILiveChatInternalDataSource from './ILiveChatInternalDataSource';
import ILiveChatRepository from './ILiveChatRepository';

export default class LiveChatRepositoryImpl implements ILiveChatRepository {

    constructor(
        private readonly cacheDataSource: ILiveChatCacheDataSource,
        private readonly internalDataSource: ILiveChatInternalDataSource,
    ) {
    }

    public async getDepartmentByName(name: string): Promise<Department | undefined> {
        return await this.internalDataSource.getDepartmentByName(name);
    }

    public async createVisitor(visitor: IVisitor): Promise<Visitor> {
        // check if department is a valid one
        let department: Department | undefined;
        if (visitor.department) {
            department = await this.getDepartmentByName(visitor.department);
            if (!department) {
                throw new AppError(`Could not find a department with name: ${visitor.department}`, HttpStatusCode.NOT_FOUND);
            }
            visitor.department = department.id;
        }

        // check if visitor already exists
        const existing = await this.internalDataSource.getVisitorByToken(visitor.token);
        if (existing) {
            visitor.username = existing.username;
        } else {
            visitor.username = await this.cacheDataSource.getNewVisitorUsername();
        }

        const created = await this.internalDataSource.createVisitor(visitor);

        return {
            visitor: created,
            department,
        } as Visitor;
    }

    public async getRoomByVisitorToken(token: string): Promise<Room> {
        const room = await this.cacheDataSource.getRoomByVisitorToken(token);
        if (!room) {
            throw new AppError(`Could not find a room for visitor token: ${token}`, HttpStatusCode.NOT_FOUND);
        }
        return room;
    }

    public async createRoom(ticketID: string, contactUUID: string, visitor: IVisitor): Promise<ILivechatRoom> {
        const cache = await this.cacheDataSource.getRoomByVisitorToken(visitor.token);
        if (cache) {
            throw new AppError(`Visitor already has an open room`, HttpStatusCode.BAD_REQUEST);
        }
        const room = await this.internalDataSource.createRoom(visitor);
        await this.cacheDataSource.saveRoom({ticketID, contactUUID, room} as Room);
        return room;
    }

    public async eventCloseRoom(room: ILivechatRoom): Promise<void> {
        await this.cacheDataSource.deleteRoom(room);
    }

    public async endpointCloseRoom(visitorToken: string): Promise<void> {
        const cache = await this.cacheDataSource.getRoomByVisitorToken(visitorToken);
        if (!cache) {
            throw new AppError(`Could not find a room for visitor token: ${visitorToken}`, HttpStatusCode.NOT_FOUND);
        }
        await this.internalDataSource.closeRoom(cache.room);
        await this.cacheDataSource.deleteRoom(cache.room);
    }

    public async sendMessage(text: string, room: ILivechatRoom): Promise<string> {
        return await this.internalDataSource.sendMessage(text, room);
    }

    public async sendChatbotHistory(messages: Array<RPMessage>, room: ILivechatRoom): Promise<string> {
        if (messages.length === 0) {
            return '';
        }
        return await this.internalDataSource.sendMessage(this.buildChatbotHistoryMessage(messages), room);
    }

    private buildChatbotHistoryMessage(messages: Array<RPMessage>): string {
        let messageText = '**Chatbot History**';

        for (let i = messages.length - 1; i >= 0; i--) {
            messageText += messages[i].direction === Direction.IN
                ? `\n> :bust_in_silhouette: [${messages[i].sentOn}]: \`${messages[i].text}\``
                : `\n> :robot: [${messages[i].sentOn}]: ${messages[i].text}`;
        }
        return messageText;
    }

}
