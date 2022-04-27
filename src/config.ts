/* eslint-disable import/no-nodejs-modules */
import {env} from 'process';
import dotenv from 'dotenv';

dotenv.config();

export enum ExitCode {
    SIGINT_SERVER_CLOSE = 2,
    SIGINT_SERVER_CLOSE_FAIL = 3,
    CRASH = 255,
}

export enum HeaderName {
    REQUEST_ID = 'X-Request-ID',
}

export const HOST = (env.HOST ?? '') || '127.0.0.1';
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
export const PORT = parseInt(env.PORT ?? '', 10) || 8080;
