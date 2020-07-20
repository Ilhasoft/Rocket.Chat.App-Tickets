import {validate} from '../../lib/validatejs/0_13_1/validate';
import { UUID_FORMAT } from '../../settings/Constants';

export default function validateRequest(query: any): any {

    const constraints = {
        'ticketId': {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
            format: {
                pattern: UUID_FORMAT,
            },
        },
        'visitor': {
            presence: {
                allowEmpty: false,
            },
        },
        'visitor.token': {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
            format: {
                pattern: UUID_FORMAT,
            },
        },
        'text': {
            presence: {
                allowEmpty: true,
            },
            type: 'string',
        },
        'attachments': {
            presence: {
                allowEmpty: true,
            },
            type: 'array',
        },
    };

    const errors = validate(query, constraints);

    return errors;

}
