import {IPersistence, IPersistenceRead} from '@rocket.chat/apps-engine/definition/accessors';
import {RocketChatAssociationRecord} from '@rocket.chat/apps-engine/definition/metadata';

export default class PersistenceUtils {

    private KEY_ASSOC_VALUE = 'value';

    constructor(
        private readonly reader: IPersistenceRead,
        private readonly writer: IPersistence,
    ) {
    }

    public async readValue(assoc: RocketChatAssociationRecord): Promise<any | undefined> {
        const value = await this.reader.readByAssociation(assoc);
        if (!value || !value[0]) {
            return undefined;
        }
        return value[0][this.KEY_ASSOC_VALUE];
    }

    public async writeValue(value: any, assoc: RocketChatAssociationRecord): Promise<void> {
        const data = {};
        data[this.KEY_ASSOC_VALUE] = value;
        await this.writer.updateByAssociation(assoc, data, true);
    }

}
