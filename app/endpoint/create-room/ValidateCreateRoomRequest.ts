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
        'visitor.department': {
            presence: false,
            type: 'string',
        },
        'visitor.token': {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
        },
        'visitor.contactUuid': {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
            format: {
                pattern: UUID_FORMAT,
            },
        },
        'visitor.name': {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
        },
        'visitor.priority': {
            presence: false,
            type: 'number',
        },
        'visitor.email': {
            presence: false,
            email: true,
            type: 'string',
        },
        'visitor.phone': {
            presence: false,
            type: 'string',
        },
    };

    const errors = validate(query, constraints);

    return errors;

}
