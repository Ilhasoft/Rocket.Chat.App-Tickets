import {IPersistence, IPersistenceRead} from '@rocket.chat/apps-engine/definition/accessors';
import { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import {RocketChatAssociationModel, RocketChatAssociationRecord} from '@rocket.chat/apps-engine/definition/metadata';
import ILiveChatCacheDataSource from '../../../data/livechat/cache-strategy/ILiveChatCacheDataSource';
import Department from '../../../domain/Department';

export default class LiveChatCacheHandler implements ILiveChatCacheDataSource {

    private static readonly ASSOC_DEPARTMENTS = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        'livechat_departments',
    );

    private static ASSOC_ROOM(visitorToken: string): RocketChatAssociationRecord {
        return new RocketChatAssociationRecord(
            RocketChatAssociationModel.MISC,
            'livechat_room_visitor_' + visitorToken,
        );
    }

    constructor(
        private readonly reader: IPersistenceRead,
        private readonly writer: IPersistence,
    ) {
    }

    // TODO: invalidate cache
    public async getDepartments(): Promise<Array<Department>> {
        const objects = await this.reader.readByAssociation(LiveChatCacheHandler.ASSOC_DEPARTMENTS);
        return objects.map((o) => o as Department);
    }

    public async saveDepartments(departments: Array<Department>): Promise<number> {
        await this.writer.removeByAssociation(LiveChatCacheHandler.ASSOC_DEPARTMENTS);
        departments.map(async (d) => {
            await this.writer.createWithAssociation(d, LiveChatCacheHandler.ASSOC_DEPARTMENTS);
        });
        return departments.length;
    }

    public async getRoomByVisitorToken(token: string): Promise<ILivechatRoom | undefined> {
        const rooms = await this.reader.readByAssociation(LiveChatCacheHandler.ASSOC_ROOM(token));
        const found = rooms.find((room: ILivechatRoom) => room.visitor.token === token);

        return found as ILivechatRoom;
    }

    public async saveRoom(room: ILivechatRoom): Promise<void> {
        await this.writer.createWithAssociation(room, LiveChatCacheHandler.ASSOC_ROOM(room.visitor.token));
    }

    public async deleteRoom(room: ILivechatRoom): Promise<void> {
        const r = await this.getRoomByVisitorToken(room.visitor.token);
        if (r) {
            await this.writer.removeByAssociation(LiveChatCacheHandler.ASSOC_ROOM(r.visitor.token));
        }
    }

}
