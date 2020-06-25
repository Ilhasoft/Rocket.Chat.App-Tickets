import Visitor from '../../domain/Visitor';

export default interface IRapidProRemoteDataSource {

    startFlow(uuid: string, visitor: Visitor, extra: any): Promise<void>;

}
