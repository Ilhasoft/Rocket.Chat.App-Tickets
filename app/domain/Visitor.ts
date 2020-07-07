export default interface Visitor {

    token: string;
    department: string;
    name: string;
    email: string;
    phone: string;
    roomId: string;
    customFields: Map<string, string>;

}
