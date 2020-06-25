import {IPersistence, IPersistenceRead} from '@rocket.chat/apps-engine/definition/accessors';
import {RocketChatAssociationModel, RocketChatAssociationRecord} from '@rocket.chat/apps-engine/definition/metadata';
import ILiveChatCacheDataSource from '../../../data/livechat/cache-strategy/ILiveChatCacheDataSource';
import Department from '../../../domain/Department';
import Visitor from '../../../domain/Visitor';

export default class LiveChatCacheHandler implements ILiveChatCacheDataSource {

    private static readonly ASSOC_DEPARTMENTS = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        'livechat_departments',
    );

    private static ASSOC_VISITOR(token: string): RocketChatAssociationRecord {
        return new RocketChatAssociationRecord(
            RocketChatAssociationModel.MISC,
            'livechat_visitor_' + token,
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

    public async getVisitor(token: string): Promise<Visitor | undefined> {
        const visitors = await this.reader.readByAssociation(LiveChatCacheHandler.ASSOC_VISITOR(token));
        const found = visitors.find((o: Visitor) => o.token === token);
        console.log('Found visitor: ', found);
        return found as Visitor;
    }

    public async saveVisitor(visitor: Visitor): Promise<void> {
        await this.writer.createWithAssociation(visitor, LiveChatCacheHandler.ASSOC_VISITOR(visitor.token));
    }

    public async deleteVisitor(visitor: Visitor): Promise<void> {
        const v = await this.getVisitor(visitor.token);
        if (v) {
            await this.writer.removeByAssociation(LiveChatCacheHandler.ASSOC_VISITOR(v.token));
        }
    }

    public async closeRoom(visitor: Visitor): Promise<void> {
        const cache = await this.getVisitor(visitor.token);
        if (cache) {
            await this.deleteVisitor(visitor);
        }
    }

}
