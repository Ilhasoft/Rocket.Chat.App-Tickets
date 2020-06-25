import {validate} from '../../lib/validatejs/0_13_1/validate';

const contactUuidFormat = `[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}`;

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
        'visitor.contactUuid': {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
            format: {
                pattern: contactUuidFormat,
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
