import { HttpStatusCode, IHttp, IModify, IPersistence, IRead, IHttpResponse } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest } from '@rocket.chat/apps-engine/definition/api';
import { IApiResponseJSON } from '@rocket.chat/apps-engine/definition/api/IResponse';
import {
    REQUEST_TIMEOUT,
} from '../settings/Constants';
import LiveChatCacheStrategyRepositoryImpl from "../data/livechat/cache-strategy/LiveChatCacheStrategyRepositoryImpl";
import LiveChatCacheHandler from "../local/livechat/cache-strategy/LiveChatCacheHandler";
import LiveChatRestApi from "../remote/livechat/cache-strategy/LiveChatRestApi";
import ILiveChatCredentials from "../remote/livechat/cache-strategy/ILiveChatCredentials";
import Visitor from "../domain/Visitor";


export class CreateRoomEndpoint extends ApiEndpoint {
    public path = 'create-room/webhook';

    public async get(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<IApiResponseJSON> {

        const baseUrl: string = await read.getEnvironmentReader().getServerSettings().getValueById('Site_Url');
        const timeout = await read.getEnvironmentReader().getSettings().getValueById(REQUEST_TIMEOUT);
        const credentials: ILiveChatCredentials = {
            authToken: request.headers['x-auth-token'],
            userId: request.headers['x-user-id']
        }

        const livechatRepo = new LiveChatCacheStrategyRepositoryImpl(
            new LiveChatCacheHandler(read.getPersistenceReader(), persis),
            new LiveChatRestApi(http, baseUrl, credentials, timeout)
        );

        const departmentName = request.query.department;
        const department = await livechatRepo.getDepartmentByName(departmentName);

        if (!department) {
            this.app.getLogger().error(`Could not find department with name: ${departmentName}`)
        }

        try {
            const visitor: Visitor = await livechatRepo.createVisitor((request.query as any) as Visitor);
            await livechatRepo.createRoom(visitor)
        } catch (e) {
            this.app.getLogger().error(e)
            return this.json({status: HttpStatusCode.INTERNAL_SERVER_ERROR, content: e})
        }

        return this.success();

    }
}
