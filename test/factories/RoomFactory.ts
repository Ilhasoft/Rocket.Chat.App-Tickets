import * as Factory from 'factory.ts';
import * as faker from 'faker';

import Room from '../../src/domain/Room';
import livechatRoomFactory from './LivechatRoomFactory';

const roomFactory = Factory.Sync.makeFactory<Room>({
    ticketID: faker.random.uuid(),
    contactUUID: faker.random.uuid(),
    room: livechatRoomFactory.build(),
    closed: false,
});

export default roomFactory;
