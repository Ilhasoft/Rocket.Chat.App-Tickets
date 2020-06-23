import {validate} from '../../lib/validatejs/0_13_1/validate';

export default function validateRequest(query: any): any {

    console.log('query: ', query);

    const constraints = {
        'visitor': {
            presence: {
                allowEmpty: false,
            },
        },
        'visitor.department': {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
        },
        'visitor.token': {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
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