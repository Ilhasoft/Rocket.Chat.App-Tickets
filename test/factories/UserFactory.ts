import { IUser, UserStatusConnection, UserType } from '@rocket.chat/apps-engine/definition/users';
import * as Factory from 'factory.ts';
import * as faker from 'faker';

const userFactory = Factory.Sync.makeFactory<IUser>({
    id: faker.random.alphaNumeric(16),
    name: faker.name.firstName(),
    username: faker.name.lastName(),
    roles: ['livechat-agent'],
    status: 'online',
    statusConnection: UserStatusConnection.ONLINE,
    type: UserType.USER,
    isEnabled: true,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    lastLoginAt: faker.date.recent(),
    emails: [],
    utcOffset: faker.random.number({ min: -12, max: 14 }),
});

export default userFactory;
