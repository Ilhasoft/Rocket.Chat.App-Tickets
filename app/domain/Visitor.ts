export default interface Visitor {

    readonly token: string,
    readonly department: string,
    readonly name: string,
    readonly email: string,
    readonly phone: string,
    readonly customFields: Array<object>

}
