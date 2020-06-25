export default interface Visitor {

    token: string;
    department: string;
    name: string;
    email: string;
    phone: string;
    customFields: Map<string, string>;

}
