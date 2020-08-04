import { HttpStatusCode } from '@rocket.chat/apps-engine/definition/accessors';

import AppError from '../../domain/AppError';
import { validate } from '../../lib/validatejs/0_13_1/validate';

export default function validateRequest(query: any): void {

    const constraints = {
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
        },
        'comment': {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
        },
    };

    const errors = validate(query, constraints);

    if (errors) {
        throw new AppError(JSON.stringify(errors), HttpStatusCode.BAD_REQUEST);
    }

}
