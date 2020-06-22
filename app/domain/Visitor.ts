export default class Visitor {

    constructor(
        public readonly token: string,
        public readonly departmentId: string,
        public readonly name: string,
        public readonly email: string,
        public readonly phoneNumber: string,
        public readonly customFields: Map<string, string>,
    ) {
    }

}
