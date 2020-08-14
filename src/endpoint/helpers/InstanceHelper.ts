import {
    IHttp,
    ILivechatRead,
    IModify,
    IPersistence,
    IPersistenceRead,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import IAppDataSource from '../../data/app/IAppDataSource';
import ILivechatCacheDataSource from '../../data/livechat/ILivechatCacheDataSource';
import ILivechatInternalDataSource from '../../data/livechat/ILivechatInternalDataSource';
import ILivechatWebhook from '../../data/livechat/ILivechatWebhook';
import AppPersistence from '../../local/app/AppPersistence';
import LiveChatAppsEngine from '../../local/livechat/LiveChatAppsEngine';
import LiveChatPersistence from '../../local/livechat/LiveChatPersistence';
import RapidProWebhook from '../../remote/livechat/RapidProWebhook';
import {CONFIG_APP_SECRET} from '../../settings/Constants';

export default class InstanceHelper {

    public static async newDefaultLivechatInternalDataSource(modify: IModify, read: ILivechatRead): Promise<ILivechatInternalDataSource> {
        return new LiveChatAppsEngine(modify, read);
    }

    public static async newDefaultLivechatCacheDataSource(read: IPersistenceRead, writer: IPersistence): Promise<ILivechatCacheDataSource> {
        return new LiveChatPersistence(read, writer);
    }

    public static async newDefaultLivechatWebhook(http: IHttp, read: IRead, writer: IPersistence): Promise<ILivechatWebhook> {
        const appDataSource: IAppDataSource = new AppPersistence(read.getPersistenceReader(), writer);
        const callbackUrl = await appDataSource.getCallbackUrl();
        if (!callbackUrl) {
            throw Error(`Callback URL not set`);
        }
        const secret = await read.getEnvironmentReader().getSettings().getValueById(CONFIG_APP_SECRET);

        return new RapidProWebhook(read, http, callbackUrl, secret);
    }

}
