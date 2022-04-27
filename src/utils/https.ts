/* eslint-disable import/no-nodejs-modules */
import {request} from 'https';
import {ErrorContext} from '@silver886/error-context';
import type {IncomingMessage} from 'http';

export async function get(requestId: string, host: string, path?: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const req = request({
            host,
            path,
        }, (res: IncomingMessage) => {
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            if (!res.statusCode || Math.floor(res.statusCode / 100) !== 2) {
                const httpStatusCode = res.statusCode?.toString();
                reject(new ErrorContext(new Error(httpStatusCode ?? 'HTTP status code unknown'), {
                    requestId,
                    source: `[get] (${__filename})`,
                    ...httpStatusCode ? {httpStatusCode} : {},
                    res,
                }));
                return;
            }

            const data: Uint8Array[] = [];

            res.on('data', (chunk) => {
                data.push(chunk as Uint8Array);
            });

            res.on('end', () => {
                resolve(Buffer.concat(data).toString());
            });
        });

        req.on('error', (err) => {
            reject(new ErrorContext(err, {
                requestId,
                source: `[get] (${__filename})`,
                err,
            }));
        });

        req.end();
    });
}
