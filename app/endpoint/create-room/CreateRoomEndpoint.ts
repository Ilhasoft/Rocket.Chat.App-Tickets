import {HttpStatusCode, IHttp, IModify, IPersistence, IRead} from '@rocket.chat/apps-engine/definition/accessors';
import {ApiEndpoint, IApiEndpointInfo, IApiRequest} from '@rocket.chat/apps-engine/definition/api';
import {IApiResponseJSON} from '@rocket.chat/apps-engine/definition/api/IResponse';
import LiveChatCacheStrategyRepositoryImpl from '../../data/livechat/cache-strategy/LiveChatCacheStrategyRepositoryImpl';
import AppError from '../../domain/AppError';
import Visitor from '../../domain/Visitor';
import LiveChatCacheHandler from '../../local/livechat/cache-strategy/LiveChatCacheHandler';
import ILiveChatCredentials from '../../remote/livechat/cache-strategy/ILiveChatCredentials';
import LiveChatRestApi from '../../remote/livechat/cache-strategy/LiveChatRestApi';
import {RC_SERVER_URL, REQUEST_TIMEOUT} from '../../settings/Constants';
import validateQuery from './ValidateCreateRoomQuery';

export class CreateRoomEndpoint extends ApiEndpoint {
    public path = 'create-room';

    public async get(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<IApiResponseJSON> {

        // Query parameters verification
        const errors = validateQuery(request.query);
        if (errors) {
            const errorMessage = `Invalid query parameters...: ${JSON.stringify(errors)}`;
            this.app.getLogger().error(errorMessage);
            return this.json({status: HttpStatusCode.BAD_REQUEST, content: {error: errorMessage}});
        }

        // Constants initialization
        const baseUrl: string = await read.getEnvironmentReader().getServerSettings().getValueById(RC_SERVER_URL);
        const timeout = await read.getEnvironmentReader().getSettings().getValueById(REQUEST_TIMEOUT);
        const credentials: ILiveChatCredentials = {
            authToken: request.headers['x-auth-token'],
            userId: request.headers['x-user-id'],
        };

        // livechatRepo initialization
        const livechatRepo = new LiveChatCacheStrategyRepositoryImpl(
            new LiveChatCacheHandler(read.getPersistenceReader(), persis),
            new LiveChatRestApi(http, baseUrl, credentials, timeout),
        );

        // Check if department is a valid one
        const departmentName = request.query.department;
        if (departmentName) {
            const department = await livechatRepo.getDepartmentByName(departmentName);
            if (!department) {
                this.app.getLogger().error(`Could not find department with name: ${departmentName}`);
                return this.json({status: HttpStatusCode.NOT_FOUND, content: {error: `Could not find department with name: ${departmentName}`}});
            }
        }

        // Execute visitor and room creation
        try {
            const visitor: Visitor = await livechatRepo.createVisitor((request.query as any) as Visitor);
            await livechatRepo.createRoom(visitor);
        } catch (e) {
            this.app.getLogger().error(e);
            if (e instanceof AppError) {
                return this.json({status: e.statusCode, content: {error: e.message}});
            }

            return this.json({status: HttpStatusCode.INTERNAL_SERVER_ERROR, content: {error: 'Unexpected error'}});
        }

        return this.success();
    }
}
