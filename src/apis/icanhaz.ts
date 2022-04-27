/* eslint-disable import/no-nodejs-modules */
import {ErrorContext} from '@silver886/error-context';
import {get} from '@@utils/https';

export async function getIp(requestId: string, ip?: 'v4' | 'v6'): Promise<string> {
    try {
        return (await get(requestId, `${ip ? `ip${ip}.` : ''}icanhazip.com`)).trim();
    } catch (err) {
        throw new ErrorContext(err instanceof Error ? err : new Error(err as string), {
            requestId,
            source: `[getIp] (${__filename})`,
            ip,
        });
    }
}

export async function getPtr(requestId: string): Promise<string> {
    try {
        return (await get(requestId, 'icanhazptr.com')).trim();
    } catch (err) {
        throw new ErrorContext(err instanceof Error ? err : new Error(err as string), {
            requestId,
            source: `[getPtr] (${__filename})`,
        });
    }
}

export async function getTrace(requestId: string): Promise<string> {
    try {
        return (await get(requestId, 'icanhaztrace.com')).trim();
    } catch (err) {
        throw new ErrorContext(err instanceof Error ? err : new Error(err as string), {
            requestId,
            source: `[getTrace] (${__filename})`,
        });
    }
}

export async function getTraceRoute(requestId: string): Promise<string> {
    try {
        return (await get(requestId, 'icanhaztraceroute.com')).trim();
    } catch (err) {
        throw new ErrorContext(err instanceof Error ? err : new Error(err as string), {
            requestId,
            source: `[getTraceRoute] (${__filename})`,
        });
    }
}

export async function getEpoch(requestId: string): Promise<string> {
    try {
        return (await get(requestId, 'icanhazepoch.com')).trim();
    } catch (err) {
        throw new ErrorContext(err instanceof Error ? err : new Error(err as string), {
            requestId,
            source: `[getEpoch] (${__filename})`,
        });
    }
}
