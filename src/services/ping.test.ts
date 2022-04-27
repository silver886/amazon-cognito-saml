/* eslint-disable import/no-namespace */
import * as icanhaz from '@@apis/icanhaz';
import {ping} from './ping';
import type {PingRequestBody} from '@@models/ping';

describe('ping', () => {
    // GIVEN
    const body: PingRequestBody = {
        echo: '2f550529-302b-44e3-85d4-cd8832ede082',
    };
    jest.spyOn(icanhaz, 'getPtr').mockImplementation(async () => Promise.resolve('1.1.1.1.in-addr.arpa'));

    it('auto IP', async () => {
        // WHEN
        jest.spyOn(icanhaz, 'getIp').mockImplementationOnce(async () => Promise.resolve('1.1.1.1'));

        // THEN
        await expect(ping(body)).
            resolves.toStrictEqual({
                echo:   '2f550529-302b-44e3-85d4-cd8832ede082',
                server: {
                    ip:  '1.1.1.1',
                    ptr: '1.1.1.1.in-addr.arpa',
                },
            });
        // eslint-disable-next-line no-undefined
        expect(icanhaz.getIp).toHaveBeenLastCalledWith(undefined);
        expect(icanhaz.getPtr).toHaveBeenLastCalledWith();
    });

    it('IPv4', async () => {
        // WHEN
        const ip = 'v4';
        jest.spyOn(icanhaz, 'getIp').mockImplementationOnce(async () => Promise.resolve('1.1.1.1'));

        // THEN
        await expect(ping(body, ip)).
            resolves.toStrictEqual({
                echo:   '2f550529-302b-44e3-85d4-cd8832ede082',
                server: {
                    ip:  '1.1.1.1',
                    ptr: '1.1.1.1.in-addr.arpa',
                },
            });
        expect(icanhaz.getIp).toHaveBeenLastCalledWith('v4');
        expect(icanhaz.getPtr).toHaveBeenLastCalledWith();
    });

    // WHEN
    it('200', async () => {
        // WHEN
        const ip = 'v6';
        jest.spyOn(icanhaz, 'getIp').mockImplementationOnce(async () => Promise.resolve('2606:4700:4700::1111'));

        // THEN
        await expect(ping(body, ip)).
            resolves.toStrictEqual({
                echo:   '2f550529-302b-44e3-85d4-cd8832ede082',
                server: {
                    ip:  '2606:4700:4700::1111',
                    ptr: '1.1.1.1.in-addr.arpa',
                },
            });
        expect(icanhaz.getIp).toHaveBeenLastCalledWith('v6');
        expect(icanhaz.getPtr).toHaveBeenLastCalledWith();
    });
});
