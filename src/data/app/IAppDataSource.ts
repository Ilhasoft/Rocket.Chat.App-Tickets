export default interface IAppDataSource {

    setCallbackUrl(url: string): Promise<void>;

    getCallbackUrl(): Promise<string | undefined>;

}
