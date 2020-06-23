import { ISetting, SettingType} from '@rocket.chat/apps-engine/definition/settings';
import {
    PUSH_BASE_URL,
    PUSH_CLOSED_FLOW,
    PUSH_MEDIA_FLOW,
    PUSH_QUEUED_FLOW,
    PUSH_TAKEN_FLOW,
    PUSH_TOKEN,
    REQUEST_TIMEOUT,
} from './Constants';

export const AppSettings: Array<ISetting> = [
    {
        id: PUSH_BASE_URL,
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: false,
        i18nLabel: 'config_push_base_url',
    },
    {
        id: PUSH_TOKEN,
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: false,
        i18nLabel: 'config_push_token',
    },
    {
        id: PUSH_TAKEN_FLOW,
        type: SettingType.STRING,
        packageValue: '',
        required: false,
        public: false,
        i18nLabel: 'config_push_taken_flow',
    },
    {
        id: PUSH_QUEUED_FLOW,
        type: SettingType.STRING,
        packageValue: '',
        required: false,
        public: false,
        i18nLabel: 'config_push_queued_flow',
    },
    {
        id: PUSH_CLOSED_FLOW,
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: false,
        i18nLabel: 'config_push_closed_flow',
    },
    {
        id: PUSH_MEDIA_FLOW,
        type: SettingType.STRING,
        packageValue: '',
        required: false,
        public: false,
        i18nLabel: 'config_push_media_flow',
    },
    {
        id: REQUEST_TIMEOUT,
        type: SettingType.NUMBER,
        packageValue: 30,
        required: true,
        public: false,
        i18nLabel: 'config_push_timeout',
    },
];
