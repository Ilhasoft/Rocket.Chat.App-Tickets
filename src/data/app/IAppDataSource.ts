export default interface IAppDataSource {

    getCallbackUrl(): Promise<string | undefined>;

    setCallbackUrl(url: string): Promise<void>;

    getRPHostUrl(): Promise<string | undefined>;

    setRPHostUrl(host: string): Promise<void>;

}
