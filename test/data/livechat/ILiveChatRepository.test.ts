import {HttpStatusCode} from '@rocket.chat/apps-engine/definition/accessors';
import {assert} from 'chai';
import {anyString, instance, mock, verify, when} from 'ts-mockito';

import 'mocha';
import ILivechatCacheDataSource from '../../../src/data/livechat/ILivechatCacheDataSource';
import ILivechatInternalDataSource from '../../../src/data/livechat/ILivechatInternalDataSource';
import ILivechatRepository from '../../../src/data/livechat/ILivechatRepository';
import ILivechatWebhook from '../../../src/data/livechat/ILivechatWebhook';
import LiveChatRepositoryImpl from '../../../src/data/livechat/LiveChatRepositoryImpl';
import AppError from '../../../src/domain/AppError';
import RPMessage, { Direction } from '../../../src/domain/RPMessage';
import departmentFactory from '../../factories/DepartmentFactory';
import livechatRoomFactory from '../../factories/LivechatRoomFactory';
import roomFactory from '../../factories/RoomFactory';
import visitorFactory from '../../factories/VisitorFactory';

describe('ILivechatRepository', () => {

    let mockedCache: ILivechatCacheDataSource;
    let mockedInternal: ILivechatInternalDataSource;
    let mockedWebhook: ILivechatWebhook;
    let livechatRepo: ILivechatRepository;

    describe('#getDepartmentByName()', () => {

        beforeEach(() => {
            mockedCache = mock<ILivechatCacheDataSource>();
            mockedInternal = mock<ILivechatInternalDataSource>();
            mockedWebhook = mock<ILivechatWebhook>();
            livechatRepo = new LiveChatRepositoryImpl(instance(mockedCache), instance(mockedInternal), instance(mockedWebhook));
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
            mockedCache = mock<ILivechatCacheDataSource>();
            mockedInternal = mock<ILivechatInternalDataSource>();
            mockedWebhook = mock<ILivechatWebhook>();
            livechatRepo = new LiveChatRepositoryImpl(instance(mockedCache), instance(mockedInternal), instance(mockedWebhook));
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
            mockedCache = mock<ILivechatCacheDataSource>();
            mockedInternal = mock<ILivechatInternalDataSource>();
            mockedWebhook = mock<ILivechatWebhook>();
            livechatRepo = new LiveChatRepositoryImpl(instance(mockedCache), instance(mockedInternal), instance(mockedWebhook));
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
            mockedCache = mock<ILivechatCacheDataSource>();
            mockedInternal = mock<ILivechatInternalDataSource>();
            mockedWebhook = mock<ILivechatWebhook>();
            livechatRepo = new LiveChatRepositoryImpl(instance(mockedCache), instance(mockedInternal), instance(mockedWebhook));
        });

        it(`should throw an error when the visitor already has an open room`, async () => {
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

        it(`should throw an error when the visitor already has an open room and the webhook call fails`, async () => {
            const ticketID = '3YffpUPb957Ca2Zx';
            const contactUUID = '1fe2e469-cfe4-4365-bc35-b4519d24d90d';
            const visitor = visitorFactory.build();

            const room = roomFactory.build({ticketID, contactUUID, closed: true});

            when(mockedCache.getRoomByVisitorToken(visitor.token)).thenResolve(room);
            when(mockedWebhook.onCloseRoom(room)).thenResolve(false);
            when(mockedCache.markRoomAsClosed(room)).thenResolve();
            try {
                await livechatRepo.createRoom(ticketID, contactUUID, visitor);
                assert.fail('should have thrown an error');
            } catch (e) {
                assert.equal(e.constructor.name, AppError.name);
                assert.equal(e.message, 'Visitor already has an open room');
                assert.equal(e.statusCode, HttpStatusCode.BAD_REQUEST);
            }
        });

        it(`should create room after webhook call succeed`, async () => {
            const ticketID = '3YffpUPb957Ca2Zx';
            const contactUUID = '1fe2e469-cfe4-4365-bc35-b4519d24d90d';
            const visitor = visitorFactory.build();

            const room = roomFactory.build({ticketID, contactUUID, closed: true});

            when(mockedCache.getRoomByVisitorToken(visitor.token)).thenResolve(room);
            when(mockedWebhook.onCloseRoom(room)).thenResolve(true);
            when(mockedCache.deleteRoom(room)).thenResolve();
            when(mockedInternal.createRoom(visitor)).thenResolve(room.room);
            when(mockedCache.saveRoom(room)).thenResolve();

            try {
                const created = await livechatRepo.createRoom(ticketID, contactUUID, visitor);
                assert.equal(created, room.room);
            } catch (e) {
                assert.fail(e);
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
            mockedCache = mock<ILivechatCacheDataSource>();
            mockedInternal = mock<ILivechatInternalDataSource>();
            mockedWebhook = mock<ILivechatWebhook>();
            livechatRepo = new LiveChatRepositoryImpl(instance(mockedCache), instance(mockedInternal), instance(mockedWebhook));
        });

        it(`should delete room if webhook call was succeed`, async () => {
            const room = roomFactory.build();

            when(mockedWebhook.onCloseRoom(room)).thenResolve(true);
            when(mockedCache.deleteRoom(room)).thenResolve();

            const closed = await livechatRepo.eventCloseRoom(room);
            verify(mockedCache.deleteRoom(room)).once();
            assert.equal(closed, true);
        });

        it(`should mark room as closed if webhook call was not succeed`, async () => {
            const room = roomFactory.build();

            when(mockedWebhook.onCloseRoom(room)).thenResolve(false);
            when(mockedCache.markRoomAsClosed(room)).thenResolve();

            const closed = await livechatRepo.eventCloseRoom(room);
            verify(mockedCache.markRoomAsClosed(room)).once();
            assert.equal(closed, false);
        });
    });

    describe('#endpointCloseRoom()', () => {

        beforeEach(() => {
            mockedCache = mock<ILivechatCacheDataSource>();
            mockedInternal = mock<ILivechatInternalDataSource>();
            mockedWebhook = mock<ILivechatWebhook>();
            livechatRepo = new LiveChatRepositoryImpl(instance(mockedCache), instance(mockedInternal), instance(mockedWebhook));
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
                verify(mockedCache.deleteRoom(room)).once();
            } catch (e) {
                assert.fail(e);
            }
        });
    });

    describe('#sendAgentMessage()', () => {
        beforeEach(() => {
            mockedCache = mock<ILivechatCacheDataSource>();
            mockedInternal = mock<ILivechatInternalDataSource>();
            mockedWebhook = mock<ILivechatWebhook>();
            livechatRepo = new LiveChatRepositoryImpl(instance(mockedCache), instance(mockedInternal), instance(mockedWebhook));
        });

        it(`should call from webhook`, async () => {
            const text = 'What do you need?';
            const room = roomFactory.build();
            const attachments = [];

            when(mockedWebhook.onAgentMessage(room, text, attachments)).thenResolve();

            await livechatRepo.sendAgentMessage(room, text, attachments);
            verify(mockedWebhook.onAgentMessage(room, text, attachments)).once();
        });
    });

    describe('#sendVisitorMessage()', () => {

        beforeEach(() => {
            mockedCache = mock<ILivechatCacheDataSource>();
            mockedInternal = mock<ILivechatInternalDataSource>();
            mockedWebhook = mock<ILivechatWebhook>();
            livechatRepo = new LiveChatRepositoryImpl(instance(mockedCache), instance(mockedInternal), instance(mockedWebhook));
        });

        it(`should close the visitor room and do not send the visitor message`, async () => {
            const text = 'Can you help me?';
            const room = roomFactory.build({closed: true});
            const attachments = [];

            when(mockedWebhook.onCloseRoom(room)).thenResolve(false);
            when(mockedCache.markRoomAsClosed(room)).thenResolve();

            const messageId = await livechatRepo.sendVisitorMessage(room, text, attachments);
            verify(mockedWebhook.onCloseRoom(room)).once();
            assert.equal(messageId, '');
        });

        it(`should throw an error when text and attachments are undefined`, async () => {
            const text = undefined;
            const room = roomFactory.build();
            const attachments = undefined;

            try {
                await livechatRepo.sendVisitorMessage(room, text, attachments);
                assert.fail('should have thrown an error');
            } catch (error) {
                assert.equal(error.constructor.name, AppError.name);
                assert.equal(error.message, `Could not send message with empty text and attachments`);
                assert.equal(error.statusCode, HttpStatusCode.BAD_REQUEST);
            }
        });

        it(`should send the visitor message`, async () => {
            const text = 'Can you help me?';
            const room = roomFactory.build();
            const attachments = [];

            when(mockedInternal.sendMessage(room.room, text, attachments)).thenResolve('2hSb3rKy8fn5uwWd');

            const messageId = await livechatRepo.sendVisitorMessage(room, text, attachments);
            verify(mockedInternal.sendMessage(room.room, text, attachments)).once();
            assert.equal(messageId, '2hSb3rKy8fn5uwWd');
        });
    });

    describe('#sendChatbotHistory()', () => {

        beforeEach(() => {
            mockedCache = mock<ILivechatCacheDataSource>();
            mockedInternal = mock<ILivechatInternalDataSource>();
            mockedWebhook = mock<ILivechatWebhook>();
            livechatRepo = new LiveChatRepositoryImpl(instance(mockedCache), instance(mockedInternal), instance(mockedWebhook));
        });

        it(`should not send the chatbot history for empty messages`, async () => {
            const messages = [];
            const room = roomFactory.build();

            const messageId = await livechatRepo.sendChatbotHistory(messages, room.room);
            assert.equal(messageId, '');
        });

        it(`should send chatbot history message`, async () => {
            const room = livechatRoomFactory.build();
            const messages = [
                {
                    direction: Direction.IN,
                    sentOn: '2020/08/13, 11:25:43',
                    text: 'Can you help me?',
                } as RPMessage,
                {
                    direction: Direction.OUT,
                    sentOn: '2020/08/13, 11:25:41',
                    text: 'Hi',
                } as RPMessage,
                {
                    direction: Direction.IN,
                    sentOn: '2020/08/13, 11:25:37',
                    text: 'Hello',
                } as RPMessage,
            ] as Array<RPMessage>;
            const history = `**Chatbot History**` +
            `\n> :bust_in_silhouette: [${messages[2].sentOn}]: \`${messages[2].text}\`` +
            `\n> :robot: [${messages[1].sentOn}]: ${messages[1].text}` +
            `\n> :bust_in_silhouette: [${messages[0].sentOn}]: \`${messages[0].text}\``;

            when(mockedInternal.sendMessage(room, history)).thenResolve('2hSb3rKy8fn5uwWd');

            const messageId = await livechatRepo.sendChatbotHistory(messages, room);
            verify(mockedInternal.sendMessage(room, history)).once();
        });

    });

});
