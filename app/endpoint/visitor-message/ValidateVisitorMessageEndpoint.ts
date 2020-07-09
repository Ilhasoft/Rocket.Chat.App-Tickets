import {validate} from '../../lib/validatejs/0_13_1/validate';

const contactUuidFormat = `[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}`;

export default function validateRequest(query: any): any {

    const constraints = {
        'contactUuid': {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
            format: {
                pattern: contactUuidFormat,
            },
        },
        'msg': {
            presence: {
                allowEmpty: true,
            },
            type: 'string',
        },
    };

    const errors = validate(query, constraints);

    return errors;

}
