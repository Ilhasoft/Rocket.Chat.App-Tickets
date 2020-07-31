import * as Factory from 'factory.ts';
import * as faker from 'faker';

import Room from '../../app/domain/Room';
import livechatRoomFactory from './LivechatRoomFactory';

const roomFactory = Factory.Sync.makeFactory<Room>({
    ticketId: faker.random.alphaNumeric(16),
    contactUuid: faker.random.uuid(),
    room: livechatRoomFactory.build(),
});

export default roomFactory;
