import { ILivechatRoom, IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import { assert } from 'chai';
import { anything, capture, instance, mock, verify, when } from 'ts-mockito';

import ILiveChatCacheDataSource from '../../../app/data/livechat/cache-strategy/ILiveChatCacheDataSource';
import ILiveChatInternalDataSource from '../../../app/data/livechat/cache-strategy/ILiveChatInternalDataSource';
import LiveChatCacheStrategyRepositoryImpl from '../../../app/data/livechat/cache-strategy/LiveChatCacheStrategyRepositoryImpl';
import ILiveChatRepository from '../../../app/data/livechat/ILiveChatRepository';
import Department from '../../../app/domain/Department';
import Room from '../../../app/domain/Room';
import departmentFactory from '../../factories/DepartmentFactory';
import livechatRoomFactory from '../../factories/LivechatRoomFactory';
import roomFactory from '../../factories/RoomFactory';
import visitorFactory from '../../factories/VisitorFactory';

describe('ILiveChatRepository', () => {

    let mockedCache: ILiveChatCacheDataSource = mock<ILiveChatCacheDataSource>();
    let mockedInternal: ILiveChatInternalDataSource = mock<ILiveChatInternalDataSource>();
    let livechatRepo: ILiveChatRepository;

    describe('#getDepartmentByName()', () => {

        beforeEach(() => {
            mockedCache = mock<ILiveChatCacheDataSource>();
            mockedInternal = mock<ILiveChatInternalDataSource>();
            livechatRepo = new LiveChatCacheStrategyRepositoryImpl(instance(mockedCache), instance(mockedInternal));
        });

        it('should call from InternalDataSource', async () => {
            const name = 'support';

            when(mockedInternal.getDepartmentByName(name)).thenResolve(departmentFactory.build());

            await livechatRepo.getDepartmentByName(name);

            verify(mockedInternal.getDepartmentByName(name)).once();
        });
    });

    describe('#eventCloseRoom()', () => {

        beforeEach(() => {
            mockedCache = mock<ILiveChatCacheDataSource>();
            mockedInternal = mock<ILiveChatInternalDataSource>();
            livechatRepo = new LiveChatCacheStrategyRepositoryImpl(instance(mockedCache), instance(mockedInternal));
        });

        it('should call from CacheDataSource', async () => {
            const livechat = livechatRoomFactory.build();

            when(mockedCache.deleteRoom(livechat)).thenResolve();

            await livechatRepo.eventCloseRoom(livechat);

            verify(mockedCache.deleteRoom(livechat)).once();
        });
    });

    describe('#sendMessage()', () => {

        beforeEach(() => {
            mockedCache = mock<ILiveChatCacheDataSource>();
            mockedInternal = mock<ILiveChatInternalDataSource>();
            livechatRepo = new LiveChatCacheStrategyRepositoryImpl(instance(mockedCache), instance(mockedInternal));
        });

        it('should call from InternalDataSource', async () => {
            const text = 'text from message';
            const attachments = mock<Array<IMessageAttachment>>();
            const livechat: ILivechatRoom = livechatRoomFactory.build();

            when(mockedInternal.sendMessage(text, attachments, livechat)).thenResolve('2hSb3rKy8fn5uwWd');

            await livechatRepo.sendMessage(text, attachments, livechat);

            verify(mockedInternal.sendMessage(text, attachments, livechat)).once();
        });
    });

    describe('#getRoomByVisitorToken()', () => {

        beforeEach(() => {
            mockedCache = mock<ILiveChatCacheDataSource>();
            mockedInternal = mock<ILiveChatInternalDataSource>();
            livechatRepo = new LiveChatCacheStrategyRepositoryImpl(instance(mockedCache), instance(mockedInternal));
        });

        it('should call from CacheDataSource', async () => {
            const token = 'jetaEBBr5jhxU3mS';
            const livechat: Room = roomFactory.build();

            when(mockedCache.getRoomByVisitorToken(token)).thenResolve(livechat);

            await livechatRepo.getRoomByVisitorToken(token);

            verify(mockedCache.getRoomByVisitorToken(token)).once();
        });

        it('should throw an Error', async () => {

            const token = 'jetaEBBr5jhxU3mS';

            when(mockedCache.getRoomByVisitorToken(token)).thenResolve(undefined);

            try {
                await livechatRepo.getRoomByVisitorToken(token);
                assert.fail('should have thrown an error');
            } catch (error) {
                assert.equal(error.toString(), `Error: Could not find room for visitor with token: ${token}`);
            }
        });
    });

    describe('#endpointCloseRoom()', () => {

        beforeEach(() => {
            mockedCache = mock<ILiveChatCacheDataSource>();
            mockedInternal = mock<ILiveChatInternalDataSource>();
            livechatRepo = new LiveChatCacheStrategyRepositoryImpl(instance(mockedCache), instance(mockedInternal));
        });

        it('should call from cache data source', async () => {
            const token = '3YffpUPb957Ca2Zx';
            const comment = 'see you later';
            const livechat: Room = roomFactory.build();

            when(mockedCache.getRoomByVisitorToken(token)).thenResolve(livechat);

            try {
                await livechatRepo.endpointCloseRoom(token, comment);
                verify(mockedCache.getRoomByVisitorToken(token)).once();
            } catch (error) {
                assert.fail(error);
            }

        });

        it('should call from internal data source', async () => {
            const token = '3YffpUPb957Ca2Zx';
            const comment = 'see you later';
            const livechat: Room = roomFactory.build();

            when(mockedCache.getRoomByVisitorToken(token)).thenResolve(livechat);
            when(mockedInternal.closeRoom(livechat.room, comment)).thenResolve();

            try {
                await livechatRepo.endpointCloseRoom(token, comment);
                verify(mockedInternal.closeRoom(livechat.room, comment)).once();
            } catch (error) {
                assert.fail(error);
            }

        });

        it('should throw an error', async () => {
            const token = '3YffpUPb957Ca2Zx';
            const comment = 'see you later';
            const livechat: Room = roomFactory.build();

            when(mockedCache.getRoomByVisitorToken(token)).thenResolve(undefined);
            when(mockedInternal.closeRoom(livechat.room, comment)).thenResolve();

            try {
                await livechatRepo.endpointCloseRoom(token, comment);
                assert.fail('should have thrown an error');
            } catch (error) {
                assert.equal(error.toString(), `Error: Could not find a room for the visitor with token: ${token}`);
            }

        });

    });

    describe('#createRoom()', () => {

        beforeEach(() => {
            mockedCache = mock<ILiveChatCacheDataSource>();
            mockedInternal = mock<ILiveChatInternalDataSource>();
            livechatRepo = new LiveChatCacheStrategyRepositoryImpl(instance(mockedCache), instance(mockedInternal));
        });

        it('should not return an existing livechat room for a new visitor', async () => {
            const ticketId = '3YffpUPb957Ca2Zx';
            const contactUuid = 'see you later';
            const livechatVisitor: IVisitor = visitorFactory.build();
            const livechat: Room = roomFactory.build();

            when(mockedCache.getRoomByVisitorToken(livechatVisitor.token)).thenResolve(undefined);

            try {
                await livechatRepo.createRoom(ticketId, contactUuid, livechatVisitor);
                verify(mockedCache.getRoomByVisitorToken(livechatVisitor.token)).once();
            } catch (error) {
                assert.fail(error);
            }

        });

        it('should return a new livechat room for the new visitor', async () => {
            const ticketId = '3YffpUPb957Ca2Zx';
            const contactUuid = 'see you later';
            const livechatVisitor: IVisitor = visitorFactory.build();
            const livechat: ILivechatRoom = livechatRoomFactory.build();

            when(mockedCache.getRoomByVisitorToken(livechatVisitor.token)).thenResolve(undefined);
            when(mockedInternal.createRoom(livechatVisitor)).thenResolve(livechat);

            try {
                await livechatRepo.createRoom(ticketId, contactUuid, livechatVisitor);
                verify(mockedInternal.createRoom(livechatVisitor)).once();
            } catch (error) {
                assert.fail(error);
            }

        });

        it('should save the new livechat room for the new visitor', async () => {
            const ticketId = '3YffpUPb957Ca2Zx';
            const contactUuid = 'see you later';
            const livechatVisitor: IVisitor = visitorFactory.build();
            const room: ILivechatRoom = livechatRoomFactory.build();

            when(mockedCache.getRoomByVisitorToken(livechatVisitor.token)).thenResolve(undefined);
            when(mockedInternal.createRoom(livechatVisitor)).thenResolve(room);
            when(mockedCache.saveRoom({ ticketId, contactUuid, room })).thenResolve();

            try {
                await livechatRepo.createRoom(ticketId, contactUuid, livechatVisitor);
                verify(mockedCache.saveRoom(anything())).once();
                const [saveRoomArg] = capture(mockedCache.saveRoom).last();
                assert.equal(saveRoomArg.ticketId, ticketId);
                assert.equal(saveRoomArg.contactUuid, contactUuid);
                assert.equal(saveRoomArg.room, room);

            } catch (error) {
                assert.fail(error);
            }

        });

        it('should thrown an error beacuse the visitor room already exists', async () => {
            const ticketId = '3YffpUPb957Ca2Zx';
            const contactUuid = 'see you later';
            const livechatVisitor: IVisitor = visitorFactory.build();
            const livechatRoom: ILivechatRoom = livechatRoomFactory.build();
            const room: Room = roomFactory.build({ ticketId, contactUuid, room: livechatRoom });

            when(mockedCache.getRoomByVisitorToken(livechatVisitor.token)).thenResolve(room);

            try {
                await livechatRepo.createRoom(ticketId, contactUuid, livechatVisitor);
                assert.fail('should have thrown an error for existing visitor room');
            } catch (error) {
                assert.equal(error.toString(), `Error: Visitor already exists`);
            }

        });

    });

    describe('#createVisitor()', () => {

        beforeEach(() => {
            mockedCache = mock<ILiveChatCacheDataSource>();
            mockedInternal = mock<ILiveChatInternalDataSource>();
            livechatRepo = new LiveChatCacheStrategyRepositoryImpl(instance(mockedCache), instance(mockedInternal));
        });

        it('should get a valid department if visitor department is specified', async () => {
            const livechatVisitor: IVisitor = visitorFactory.build();
            const department: Department = departmentFactory.build({ name: livechatVisitor.department });

            when(mockedInternal.getDepartmentByName(livechatVisitor.department!)).thenResolve(department);

            try {
                await livechatRepo.createVisitor(livechatVisitor);
                verify(mockedInternal.getDepartmentByName(department.name)).once();
            } catch (error) {
                assert.fail(error);
            }

        });

        it('should not get a valid department because visitor department is not specified', async () => {
            const livechatVisitor: IVisitor = visitorFactory.build({ department: undefined });
            const department: Department = departmentFactory.build({ name: livechatVisitor.department });

            when(mockedInternal.getDepartmentByName(livechatVisitor.department!)).thenResolve(department);

            try {
                await livechatRepo.createVisitor(livechatVisitor);
                verify(mockedInternal.getDepartmentByName(department.name)).never();
            } catch (error) {
                assert.fail(error);
            }

        });

        it('should throw an error beacuse of an invalid department', async () => {
            const livechatVisitor: IVisitor = visitorFactory.build();
            const department: Department = departmentFactory.build({ name: livechatVisitor.department });

            when(mockedInternal.getDepartmentByName(livechatVisitor.department!)).thenResolve(undefined);

            try {
                await livechatRepo.createVisitor(livechatVisitor);
                assert.fail('should have thrown an error for invalid department');
            } catch (error) {
                assert.equal(error.toString(), `Error: Could not find department with name: ${livechatVisitor.department}`);
            }

        });

        it('should get visitor from internal data source', async () => {
            const livechatVisitor: IVisitor = visitorFactory.build();
            const department: Department = departmentFactory.build({ name: livechatVisitor.department });

            when(mockedInternal.getDepartmentByName(livechatVisitor.department!)).thenResolve(department);
            when(mockedInternal.getVisitorByToken(livechatVisitor.token)).thenResolve(livechatVisitor);

            try {
                await livechatRepo.createVisitor(livechatVisitor);
                verify(mockedInternal.getVisitorByToken(livechatVisitor.token)).once();
            } catch (error) {
                assert.fail(error);
            }

        });

        it('should get a new visitor username from cache data source', async () => {
            const livechatVisitor: IVisitor = visitorFactory.build();
            const department: Department = departmentFactory.build({ name: livechatVisitor.department });

            when(mockedInternal.getDepartmentByName(livechatVisitor.department!)).thenResolve(department);
            when(mockedInternal.getVisitorByToken(livechatVisitor.token)).thenResolve(undefined);

            try {
                await livechatRepo.createVisitor(livechatVisitor);
                verify(mockedCache.getNewVisitorUsername()).once();
            } catch (error) {
                assert.fail(error);
            }

        });

        it('should not get a new visitor username from cache data source', async () => {
            const livechatVisitor: IVisitor = visitorFactory.build();
            const department: Department = departmentFactory.build({ name: livechatVisitor.department });

            when(mockedInternal.getDepartmentByName(livechatVisitor.department!)).thenResolve(department);
            when(mockedInternal.getVisitorByToken(livechatVisitor.token)).thenResolve(livechatVisitor);

            try {
                await livechatRepo.createVisitor(livechatVisitor);
                verify(mockedCache.getNewVisitorUsername()).never();
            } catch (error) {
                assert.fail(error);
            }

        });

        it('should create a new visitor', async () => {
            const livechatVisitor: IVisitor = visitorFactory.build();
            const department: Department = departmentFactory.build({ name: livechatVisitor.department });

            when(mockedInternal.getDepartmentByName(livechatVisitor.department!)).thenResolve(department);
            when(mockedInternal.getVisitorByToken(livechatVisitor.token)).thenResolve(livechatVisitor);
            when(mockedInternal.createVisitor(livechatVisitor)).thenResolve(livechatVisitor);

            try {
                await livechatRepo.createVisitor(livechatVisitor);
                verify(mockedInternal.createVisitor(livechatVisitor)).once();
            } catch (error) {
                assert.fail(error);
            }

        });

    });

});
