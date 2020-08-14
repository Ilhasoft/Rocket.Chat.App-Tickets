import {IPersistence, IPersistenceRead} from '@rocket.chat/apps-engine/definition/accessors';
import {RocketChatAssociationModel, RocketChatAssociationRecord} from '@rocket.chat/apps-engine/definition/metadata';

import ILivechatCacheDataSource from '../../data/livechat/ILivechatCacheDataSource';
import Room from '../../domain/Room';
import PersistenceUtils from '../../utils/PersistenceUtils';

export default class LiveChatPersistence implements ILivechatCacheDataSource {

    private static readonly ASSOC_VISITOR_COUNT = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        'visitor_count',
    );

    private static ASSOC_ROOM(visitorToken: string): RocketChatAssociationRecord {
        return new RocketChatAssociationRecord(
            RocketChatAssociationModel.MISC,
            'livechat_room_visitor_' + visitorToken,
        );
    }

    private persisUtils: PersistenceUtils;

    constructor(
        private readonly reader: IPersistenceRead,
        private readonly writer: IPersistence,
    ) {
        this.persisUtils = new PersistenceUtils(reader, writer);
    }

    public async getRoomByVisitorToken(token: string): Promise<Room | undefined> {
        const rooms = await this.reader.readByAssociation(LiveChatPersistence.ASSOC_ROOM(token));
        const found = rooms.find((room: Room) => room.room.visitor.token === token);

        return found as Room;
    }

    public async getNewVisitorUsername(): Promise<string> {
        let count = await this.persisUtils.readValue(LiveChatPersistence.ASSOC_VISITOR_COUNT);
        if (!count) {
            count = 0;
        }
        count += 1;
        await this.persisUtils.writeValue(count, LiveChatPersistence.ASSOC_VISITOR_COUNT);
        return `guest-${count}`;
    }

    public async saveRoom(room: Room): Promise<void> {
        room.closed = false;
        await this.writer.createWithAssociation(room, LiveChatPersistence.ASSOC_ROOM(room.room.visitor.token));
    }

    public async markRoomAsClosed(room: Room): Promise<void> {
        room.closed = true;
        await this.writer.updateByAssociation(LiveChatPersistence.ASSOC_ROOM(room.room.visitor.token), room);
    }

    public async deleteRoom(room: Room): Promise<void> {
        const r = await this.getRoomByVisitorToken(room.room.visitor.token);
        if (r) {
            await this.writer.removeByAssociation(LiveChatPersistence.ASSOC_ROOM(room.room.visitor.token));
        }
    }

}
