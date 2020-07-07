import {validate} from '../../lib/validatejs/0_13_1/validate';

// TODO: dar match com regex
export default function validateRequest(query: any): any {

    const constraints = {
        'secret': {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
        },
    };

    const errors = validate(query, constraints);

    return errors;

}
