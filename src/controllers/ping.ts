/* eslint-disable new-cap */
import {Body, Controller, Example, Post, Query, Request, Response, Route, Tags} from '@tsoa/runtime';
import {StatusCodes} from 'http-status-codes';
import {CompositeRequest} from '@@models/common';
import {PingRequestBody} from '@@models/ping';
import {ping} from '@@services/ping';
import type {BasicResponse} from '@@models/common';
import type {PingResponse} from '@@models/ping';

@Route('ping')
@Tags('Health')
export class PingController extends Controller {
    /**
     * Always response `echo` from body and IP address and PTR of server.
     *
     * @example body {
     *   "echo": "Hello from the outside"
     * }
     */
    // eslint-disable-next-line class-methods-use-this
    @Example<BasicResponse & PingResponse>({
        requestId: '9476a191-43a1-4459-8743-dc4b4d267680',
        echo:      'Hello from the outside',
        server:    {
            ip:  '1.1.1.1',
            ptr: '1.1.1.1.in-addr.arpa',
        },
    })
    @Response<BasicResponse & {message: string}>(StatusCodes.INTERNAL_SERVER_ERROR, 'Internal Server Error', {
        requestId: '00bae0e1-b6b9-44a3-a132-401c9e3a83d3',
        message:   'Internal Server Error',
    })
    @Post('/')
    public async ping(
        @Request() request: CompositeRequest,
            @Body() body: PingRequestBody,
            @Query() ip?: 'v4' | 'v6',
    ): Promise<BasicResponse & PingResponse> {
        return ping(request, body, ip);
    }
}
