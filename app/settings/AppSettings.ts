import { ISetting, SettingType} from '@rocket.chat/apps-engine/definition/settings';
import {
    APP_SECRET,
    REQUEST_TIMEOUT,
} from './Constants';

export const AppSettings: Array<ISetting> = [
    {
        id: APP_SECRET,
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: false,
        i18nLabel: 'app_secret',
    },
    {
        id: REQUEST_TIMEOUT,
        type: SettingType.NUMBER,
        packageValue: 30,
        required: true,
        public: false,
        i18nLabel: 'config_timeout',
    },
];
