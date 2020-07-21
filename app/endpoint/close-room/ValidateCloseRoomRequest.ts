import {validate} from '../../lib/validatejs/0_13_1/validate';

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
        'comment': {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
        },
    };

    const errors = validate(query, constraints);

    return errors;

}
