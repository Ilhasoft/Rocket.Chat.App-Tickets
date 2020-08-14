import Room from '../../domain/Room';

export default interface ILiveChatCacheDataSource {

    getRoomByVisitorToken(token: string): Promise<Room | undefined>;

    getNewVisitorUsername(): Promise<string>;

    saveRoom(room: Room): Promise<void>;

    markRoomAsClosed(room: Room): Promise<void>;

    deleteRoom(room: Room): Promise<void>;

}
