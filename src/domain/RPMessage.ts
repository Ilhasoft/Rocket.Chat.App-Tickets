export default interface RPMessage {

    readonly direction: Direction;
    readonly sentOn: string;
    readonly text: string;

}

export enum Direction {
    IN = 'in', // incoming
    OUT = 'out', // outgoing
}
