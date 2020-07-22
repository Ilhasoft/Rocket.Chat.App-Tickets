import { validate } from '../../lib/validatejs/0_13_1/validate';

export default function validateRequest(query: any): any {

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
