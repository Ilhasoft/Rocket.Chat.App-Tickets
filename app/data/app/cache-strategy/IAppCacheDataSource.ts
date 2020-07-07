export default interface IAppCacheDataSource {

    setCallbackUrl(url: string): Promise<void>;

    getCallbackUrl(): Promise<string | undefined>;

}
