import * as Factory from 'factory.ts';
import * as faker from 'faker';

import Department from '../../app/domain/Department';

const departmentFactory = Factory.Sync.makeFactory<Department>({
    id: faker.random.alphaNumeric(16),
    name: faker.name.jobTitle(),
});

export default departmentFactory;
