import {validate} from '../../lib/validatejs/0_13_1/validate';

export default function validateQuery(query: object): any {

    const constraints = {
        department: {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
        },
        token: {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
        },
        name: {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
        },
        priority: {
            presence: false,
            type: 'number',
        },
        email: {
            presence: false,
            email: true,
            type: 'string',
        },
        phone: {
            presence: false,
            type: 'string',
        },
    };

    const errors = validate(query, constraints);

    return errors;

}
