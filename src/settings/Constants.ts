import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export const RC_SERVER_URL = 'Site_Url';

export const CONFIG_APP_SECRET = 'config_app_secret';
export const CONFIG_RAPIDPRO_AUTH_TOKEN = 'config_rapidpro_auth_token';
export const CONFIG_REQUEST_TIMEOUT = 'config_request_timeout';
export const CONFIG_HISTORY_TIME = 'config_history_time';
export const CONFIG_DEFAULT_TIMEZONE = 'config_default_timezone';

export const APP_SETTINGS: Array<ISetting> = [
    {
        id: CONFIG_APP_SECRET,
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: false,
        i18nLabel: CONFIG_APP_SECRET,
    },
    {
        id: CONFIG_RAPIDPRO_AUTH_TOKEN,
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: false,
        i18nLabel: CONFIG_RAPIDPRO_AUTH_TOKEN,
    },
    {
        id: CONFIG_REQUEST_TIMEOUT,
        type: SettingType.NUMBER,
        packageValue: 15,
        required: true,
        public: false,
        i18nLabel: CONFIG_REQUEST_TIMEOUT,
    },
    {
        id: CONFIG_HISTORY_TIME,
        type: SettingType.NUMBER,
        packageValue: 6,
        required: false,
        public: false,
        i18nLabel: CONFIG_HISTORY_TIME,
    },
    {
        id: CONFIG_DEFAULT_TIMEZONE,
        type: SettingType.NUMBER,
        packageValue: null,
        required: false,
        public: false,
        i18nLabel: CONFIG_DEFAULT_TIMEZONE,
    },
];
