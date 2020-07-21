import Room from '../../../domain/Room';

export default interface IWebhookRepository {

   onCloseRoom(room: Room): Promise<void>;

}
