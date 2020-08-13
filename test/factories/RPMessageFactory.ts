import * as Factory from 'factory.ts';
import * as faker from 'faker';

import RPMessage, { Direction } from '../../src/domain/RPMessage';

const rpMessageFactory = Factory.Sync.makeFactory<RPMessage>({
    direction: faker.random.arrayElement([Direction.IN, Direction.OUT]),
    sentOn: faker.date.recent().toString(),
    text: faker.random.words(),
});

export default rpMessageFactory;
