import {ErrorContext} from '@silver886/error-context';
import {getIp, getPtr} from '@@apis/icanhaz';
import type {BasicResponse, CompositeRequest} from '@@models/common';
import type {PingRequestBody, PingResponse} from '@@models/ping';

export async function ping(request: CompositeRequest, body: PingRequestBody, ip?: 'v4' | 'v6'): Promise<BasicResponse & PingResponse> {
    try {
        const gotIp = await getIp(request.id, ip);
        const gotPtr = await getPtr(request.id);
        return {
            requestId: request.id,
            echo:      body.echo,
            server:    {
                ip:  gotIp,
                ptr: gotPtr,
            },
        };
    } catch (err) {
        throw new ErrorContext(err instanceof Error ? err : new Error(err as string), {
            requestId: request.id,
            source:    `[ping] (${__filename})`,
            request,
            body,
            ip,
        });
    }
}
