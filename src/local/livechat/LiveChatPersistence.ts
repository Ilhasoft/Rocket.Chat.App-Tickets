import { IPersistence, IPersistenceRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';

import ILiveChatCacheDataSource from '../../data/livechat/ILiveChatCacheDataSource';
import Room from '../../domain/Room';

export default class LiveChatPersistence implements ILiveChatCacheDataSource {

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

    constructor(
        private readonly reader: IPersistenceRead,
        private readonly writer: IPersistence,
    ) {
    }

    public async getRoomByVisitorToken(token: string): Promise<Room | undefined> {
        const rooms = await this.reader.readByAssociation(LiveChatPersistence.ASSOC_ROOM(token));
        const found = rooms.find((room: Room) => room.room.visitor.token === token);

        return found as Room;
    }

    public async saveRoom(room: Room): Promise<void> {
        await this.writer.createWithAssociation(room, LiveChatPersistence.ASSOC_ROOM(room.room.visitor.token));
    }

    public async deleteRoom(room: ILivechatRoom): Promise<void> {
        const r = await this.getRoomByVisitorToken(room.visitor.token);
        if (r) {
            await this.writer.removeByAssociation(LiveChatPersistence.ASSOC_ROOM(room.visitor.token));
        }
    }

    public async getNewVisitorUsername(): Promise<string> {
        let count;
        const assoc = await this.reader.readByAssociation(LiveChatPersistence.ASSOC_VISITOR_COUNT);
        if (!assoc[0]) {
            count = 0;
            await this.writer.createWithAssociation({count}, LiveChatPersistence.ASSOC_VISITOR_COUNT);
        } else {
            count = assoc[0]['count'];
        }
        count += 1;
        await this.writer.updateByAssociation(LiveChatPersistence.ASSOC_VISITOR_COUNT, {count});
        return `guest-${count}`;
    }

}
