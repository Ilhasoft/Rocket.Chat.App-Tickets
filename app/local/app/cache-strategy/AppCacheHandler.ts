import { IPersistenceRead, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationRecord, RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata';
import IAppCacheDataSource from '../../../data/app/cache-strategy/IAppCacheDataSource';
import { CALLBACK_URL_PERSISTENCE } from '../../../settings/Constants';

export default class AppCacheHandler implements IAppCacheDataSource {

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
        await this.writer.removeByAssociation(AppCacheHandler.ASSOC_CALLBACK_URL);
        await this.writer.createWithAssociation({url}, AppCacheHandler.ASSOC_CALLBACK_URL);
    }
    public async getCallbackUrl(): Promise<string | undefined> {
        const callbackUrl = await this.reader.readByAssociation(AppCacheHandler.ASSOC_CALLBACK_URL);

        return (callbackUrl as any) as string;
    }

}
