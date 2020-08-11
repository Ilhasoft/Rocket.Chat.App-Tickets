import {HttpStatusCode} from '@rocket.chat/apps-engine/definition/accessors';
import {assert} from 'chai';
import {anyString, instance, mock, verify, when} from 'ts-mockito';

import ILiveChatCacheDataSource from '../../../src/data/livechat/ILiveChatCacheDataSource';
import ILiveChatInternalDataSource from '../../../src/data/livechat/ILiveChatInternalDataSource';
import ILiveChatRepository from '../../../src/data/livechat/ILiveChatRepository';
import LiveChatRepositoryImpl from '../../../src/data/livechat/LiveChatRepositoryImpl';
import AppError from '../../../src/domain/AppError';
import departmentFactory from '../../factories/DepartmentFactory';
import livechatRoomFactory from '../../factories/LivechatRoomFactory';
import roomFactory from '../../factories/RoomFactory';
import visitorFactory from '../../factories/VisitorFactory';

describe('ILiveChatRepository', () => {

    let mockedCache: ILiveChatCacheDataSource;
    let mockedInternal: ILiveChatInternalDataSource;
    let livechatRepo: ILiveChatRepository;

    describe('#getDepartmentByName()', () => {

        beforeEach(() => {
            mockedCache = mock<ILiveChatCacheDataSource>();
            mockedInternal = mock<ILiveChatInternalDataSource>();
            livechatRepo = new LiveChatRepositoryImpl(instance(mockedCache), instance(mockedInternal));
        });

        it(`should call from internal data source`, async () => {
            const name = 'help';

            when(mockedInternal.getDepartmentByName(name)).thenResolve(departmentFactory.build());

            await livechatRepo.getDepartmentByName(name);
            verify(mockedInternal.getDepartmentByName(name)).once();
        });
    });

    describe('#createVisitor()', () => {

        beforeEach(() => {
            mockedCache = mock<ILiveChatCacheDataSource>();
            mockedInternal = mock<ILiveChatInternalDataSource>();
            livechatRepo = new LiveChatRepositoryImpl(instance(mockedCache), instance(mockedInternal));
        });

        it('should try to get the department when its name is specified', async () => {
            const department = 'help';
            const visitor = visitorFactory.build({department});

            when(mockedInternal.getDepartmentByName(visitor.department!)).thenResolve(undefined);

            try {
                await livechatRepo.createVisitor(visitor);
                assert.fail('should have thrown an error');
            } catch (e) {
                verify(mockedInternal.getDepartmentByName(department)).once();
            }
        });

        it(`shouldn't try to get the department when its name isn't specified`, async () => {
            const livechatVisitor = visitorFactory.build({department: undefined});

            try {
                await livechatRepo.createVisitor(livechatVisitor);
                verify(mockedInternal.getDepartmentByName(anyString())).never();
            } catch (e) {
                assert.fail(e.message);
            }
        });

        it(`should throw an error when the specified department doesn't exists`, async () => {
            const department = 'help';
            const visitor = visitorFactory.build({department});

            when(mockedInternal.getDepartmentByName(department)).thenResolve(undefined);

            try {
                await livechatRepo.createVisitor(visitor);
                assert.fail('should have thrown an error');
            } catch (e) {
                assert.equal(e.constructor.name, AppError.name);
                assert.equal(e.message, `Could not find a department with name: ${department}`);
                assert.equal(e.statusCode, HttpStatusCode.NOT_FOUND);
            }
        });

        it(`should set the department ID on visitor when the specified department exists`, async () => {
            const department = departmentFactory.build();
            const visitor = visitorFactory.build({department: department.name});

            when(mockedInternal.getDepartmentByName(department.name)).thenResolve(department);

            try {
                await livechatRepo.createVisitor(visitor);
                assert.equal(visitor.department, department.id);
            } catch (e) {
                assert.fail(e);
            }
        });

        it(`should set existing username on the given visitor when it exists`, async () => {
            const token = '1234';
            const visitor = visitorFactory.build({token, department: undefined});
            const existing = visitorFactory.build({token});

            when(mockedInternal.getVisitorByToken(token)).thenResolve(existing);

            try {
                await livechatRepo.createVisitor(visitor);
                assert.equal(visitor.username, existing.username);
            } catch (e) {
                assert.fail(e);
            }
        });

        it(`should set a new username on the given visitor when it not exists`, async () => {
            const token = '1234';
            const visitor = visitorFactory.build({token, department: undefined});
            const newUsername = 'guest-1';

            when(mockedInternal.getVisitorByToken(token)).thenResolve(undefined);
            when(mockedCache.getNewVisitorUsername()).thenResolve(newUsername);

            try {
                await livechatRepo.createVisitor(visitor);
                assert.equal(visitor.username, newUsername);
            } catch (e) {
                assert.fail(e);
            }
        });

        it('should create a new visitor and return it', async () => {
            const department = departmentFactory.build();
            const visitor = visitorFactory.build({department: department.name});

            when(mockedInternal.getDepartmentByName(visitor.department!)).thenResolve(department);
            when(mockedInternal.getVisitorByToken(visitor.token)).thenResolve(undefined);
            when(mockedCache.getNewVisitorUsername()).thenResolve('guest-1');
            when(mockedInternal.createVisitor(visitor)).thenResolve(visitor);

            try {
                const created = await livechatRepo.createVisitor(visitor);
                assert.equal(created.visitor, visitor);
                assert.equal(created.department, department);
            } catch (e) {
                assert.fail(e);
            }
        });
    });

    describe('#getRoomByVisitorToken()', () => {

        beforeEach(() => {
            mockedCache = mock<ILiveChatCacheDataSource>();
            mockedInternal = mock<ILiveChatInternalDataSource>();
            livechatRepo = new LiveChatRepositoryImpl(instance(mockedCache), instance(mockedInternal));
        });

        it(`should throw an error when the visitor doesn't have an open room`, async () => {
            const token = 'jetaEBBr5jhxU3mS';

            when(mockedCache.getRoomByVisitorToken(token)).thenResolve(undefined);

            try {
                await livechatRepo.getRoomByVisitorToken(token);
                assert.fail('should have thrown an error');
            } catch (e) {
                assert.equal(e.constructor.name, AppError.name);
                assert.equal(e.message, `Could not find a room for visitor token: ${token}`);
                assert.equal(e.statusCode, HttpStatusCode.NOT_FOUND);
            }
        });

        it(`should return a room when the visitor have an open room`, async () => {
            const token = 'jetaEBBr5jhxU3mS';
            const room = roomFactory.build();

            when(mockedCache.getRoomByVisitorToken(token)).thenResolve(room);

            const returned = await livechatRepo.getRoomByVisitorToken(token);
            assert.equal(returned, room);
        });
    });

    describe('#createRoom()', () => {

        beforeEach(() => {
            mockedCache = mock<ILiveChatCacheDataSource>();
            mockedInternal = mock<ILiveChatInternalDataSource>();
            livechatRepo = new LiveChatRepositoryImpl(instance(mockedCache), instance(mockedInternal));
        });

        it(`should throw an error when the visitor already have an open room`, async () => {
            const ticketID = '3YffpUPb957Ca2Zx';
            const contactUUID = '1fe2e469-cfe4-4365-bc35-b4519d24d90d';
            const visitor = visitorFactory.build();

            const room = roomFactory.build({ticketID, contactUUID});

            when(mockedCache.getRoomByVisitorToken(visitor.token)).thenResolve(room);

            try {
                await livechatRepo.createRoom(ticketID, contactUUID, visitor);
                assert.fail('should have thrown an error');
            } catch (e) {
                assert.equal(e.constructor.name, AppError.name);
                assert.equal(e.message, 'Visitor already has an open room');
                assert.equal(e.statusCode, HttpStatusCode.BAD_REQUEST);
            }
        });

        it(`should create the room on internal data source, save on cache data source, then return it`, async () => {
            const ticketID = '3YffpUPb957Ca2Zx';
            const contactUUID = '1fe2e469-cfe4-4365-bc35-b4519d24d90d';
            const visitor = visitorFactory.build();
            const room = roomFactory.build({ticketID, contactUUID});

            when(mockedCache.getRoomByVisitorToken(visitor.token)).thenResolve(undefined);
            when(mockedInternal.createRoom(visitor)).thenResolve(room.room);
            when(mockedCache.saveRoom(room)).thenResolve();

            try {
                const created = await livechatRepo.createRoom(ticketID, contactUUID, visitor);
                assert.equal(created, room.room);
            } catch (e) {
                assert.fail(e);
            }
        });
    });

    describe('#eventCloseRoom()', () => {

        beforeEach(() => {
            mockedCache = mock<ILiveChatCacheDataSource>();
            mockedInternal = mock<ILiveChatInternalDataSource>();
            livechatRepo = new LiveChatRepositoryImpl(instance(mockedCache), instance(mockedInternal));
        });

        it(`should call from cache data source`, async () => {
            const room = livechatRoomFactory.build();

            when(mockedCache.deleteRoom(room)).thenResolve();

            await livechatRepo.eventCloseRoom(room);
            verify(mockedCache.deleteRoom(room)).once();
        });
    });

    describe('#endpointCloseRoom()', () => {

        beforeEach(() => {
            mockedCache = mock<ILiveChatCacheDataSource>();
            mockedInternal = mock<ILiveChatInternalDataSource>();
            livechatRepo = new LiveChatRepositoryImpl(instance(mockedCache), instance(mockedInternal));
        });

        it(`should throw an error when the given visitor doesn't have an open room`, async () => {
            const token = '3YffpUPb957Ca2Zx';

            when(mockedCache.getRoomByVisitorToken(token)).thenResolve(undefined);

            try {
                await livechatRepo.endpointCloseRoom(token);
                assert.fail('should have thrown an error');
            } catch (error) {
                assert.equal(error.constructor.name, AppError.name);
                assert.equal(error.message, `Could not find a room for visitor token: ${token}`);
                assert.equal(error.statusCode, HttpStatusCode.NOT_FOUND);
            }
        });

        it(`should close the room on internal data source and delete from cache data source`, async () => {
            const token = '3YffpUPb957Ca2Zx';
            const room = roomFactory.build();

            when(mockedCache.getRoomByVisitorToken(token)).thenResolve(room);

            try {
                await livechatRepo.endpointCloseRoom(token);
                verify(mockedInternal.closeRoom(room.room)).once();
                verify(mockedCache.deleteRoom(room.room)).once();
            } catch (e) {
                assert.fail(e);
            }
        });
    });

    describe('#sendMessage()', () => {

        beforeEach(() => {
            mockedCache = mock<ILiveChatCacheDataSource>();
            mockedInternal = mock<ILiveChatInternalDataSource>();
            livechatRepo = new LiveChatRepositoryImpl(instance(mockedCache), instance(mockedInternal));
        });

        it(`should call from internal data source`, async () => {
            const text = 'Can you help me?';
            const room = livechatRoomFactory.build();

            when(mockedInternal.sendMessage(text, room)).thenResolve('2hSb3rKy8fn5uwWd');

            await livechatRepo.sendVisitorMessage(text, room);
            verify(mockedInternal.sendMessage(text, room)).once();
        });
    });

});
