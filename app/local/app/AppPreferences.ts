import { IPersistence, IPersistenceRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';

import IAppDataSource from '../../data/app/IAppDataSource';
import { CALLBACK_URL_PERSISTENCE } from '../../settings/Constants';

export default class AppPreferences implements IAppDataSource {

    private static readonly ASSOC_CALLBACK_URL = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        CALLBACK_URL_PERSISTENCE,
    );

    constructor(
        private readonly reader: IPersistenceRead,
        private readonly writer: IPersistence,
    ) {
    }

    public async setCallbackUrl(url: string): Promise<void> {
        await this.writer.removeByAssociation(AppPreferences.ASSOC_CALLBACK_URL);
        await this.writer.createWithAssociation({url}, AppPreferences.ASSOC_CALLBACK_URL);
    }
    public async getCallbackUrl(): Promise<string | undefined> {
        const callbackUrl = await this.reader.readByAssociation(AppPreferences.ASSOC_CALLBACK_URL);
        if (!callbackUrl[0]) {
            return undefined;
        }
        return (callbackUrl[0] as any).url;
    }

}
