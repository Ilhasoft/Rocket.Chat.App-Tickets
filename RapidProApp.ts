import {
    IAppAccessors, IConfigurationExtend, IEnvironmentRead,
    ILogger,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import {ApiSecurity, ApiVisibility, IApi} from "@rocket.chat/apps-engine/definition/api";
import {CreateRoomEndpoint} from "./app/endpoints/CreateRoomEndpoint";
import { AppSettings } from "./app/settings/AppSettings";

export class RapidProApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async initialize(configurationExtend: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        await this.extendConfiguration(configurationExtend);
        await configurationExtend.api.provideApi({
            visibility: ApiVisibility.PUBLIC,
            security: ApiSecurity.UNSECURE,
            endpoints: [
                new CreateRoomEndpoint(this),
            ],
        } as IApi);
        this.getLogger().log('RapidPro App Initialized');
    }

    public async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        AppSettings.forEach((setting) => configuration.settings.provideSetting(setting));
    }

}
