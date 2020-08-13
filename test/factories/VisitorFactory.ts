import { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import * as Factory from 'factory.ts';
import * as faker from 'faker';

const visitorFactory = Factory.Sync.makeFactory<IVisitor>({
    token: faker.random.uuid(),
    name: 'livechat-visitor',
    username: 'livechat-visitor-username',
    department: faker.name.jobArea(),
});

export default visitorFactory;
