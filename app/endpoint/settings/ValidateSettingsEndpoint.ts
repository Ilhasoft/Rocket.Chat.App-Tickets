import { validate } from '../../lib/validatejs/0_13_1/validate';

export default function validateRequest(query: any): any {

    const constraints = {
        'webhook': {
            presence: {
                allowEmpty: false,
            },
        },
        'webhook.url': {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
            url: true,
        },
    };

    const errors = validate(query, constraints);

    return errors;

}
