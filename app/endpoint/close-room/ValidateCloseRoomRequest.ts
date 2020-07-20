import {validate} from '../../lib/validatejs/0_13_1/validate';
import { UUID_FORMAT } from '../../settings/Constants';

export default function validateRequest(query: any): any {

    const constraints = {
        ticketId: {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
            format: {
                pattern: UUID_FORMAT,
            },
        },
        token: {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
            format: {
                pattern: UUID_FORMAT,
            },
        },
        comment: {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
        },
    };

    const errors = validate(query, constraints);

    return errors;

}
