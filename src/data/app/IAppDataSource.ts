export default interface IAppDataSource {

    getCallbackUrl(): Promise<string | undefined>;

    setCallbackUrl(url: string): Promise<void>;

}
