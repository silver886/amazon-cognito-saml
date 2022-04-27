/* eslint-disable import/unambiguous */
import {get} from './https';

describe('get', () => {
    // GIVEN
    const service = 'httpbin.org';

    it('200', async () => {
        // WHEN
        const status = '200';

        // THEN
        await expect(get(service, `/status/${status}`)).
            resolves.toStrictEqual('');
    });

    it('300', async () => {
        // WHEN
        const status = '300';

        // THEN
        await expect(get(service, `/status/${status}`)).
            rejects.toThrowError(`Status Code: ${status}`);
    });

    it('400', async () => {
        // WHEN
        const status = '400';

        // THEN
        await expect(get(service, `/status/${status}`)).
            rejects.toThrowError(`Status Code: ${status}`);
    });

    it('500', async () => {
        // WHEN
        const status = '500';

        // THEN
        await expect(get(service, `/status/${status}`)).
            rejects.toThrowError(`Status Code: ${status}`);
    });
});
