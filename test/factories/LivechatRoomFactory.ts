import { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import * as Factory from 'factory.ts';
import * as faker from 'faker';

import userFactory from './UserFactory';
import visitorFactory from './VisitorFactory';

const livechatRoomFactory = Factory.Sync.makeFactory<ILivechatRoom>({
    id: faker.random.alphaNumeric(16),
    creator: userFactory.build(),
    visitor: visitorFactory.build(),
    type: RoomType.LIVE_CHAT,
    usernames: ['user1, user2'],
    slugifiedName: 'livechat-room',
    isOpen: true,
    isWaitingResponse: true,
});

export default livechatRoomFactory;
