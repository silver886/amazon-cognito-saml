import {brotliCompressSync, brotliDecompressSync} from 'zlib';
import {ErrorContext} from '@silver886/error-context';
import {StatusCodes} from 'http-status-codes';
import {isState} from '@@src/models/saml';
import type {State} from '@@src/models/saml';

export function divide(state: State): [string, string] {
   const compressed = brotliCompressSync(JSON.stringify(state));
   return [
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      Buffer.from(compressed.filter((_, i) => i % 2 === 0)).toString('base64'),
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      Buffer.from(compressed.filter((_, i) => i % 2 === 1)).toString('base64'),
   ];
}

export function combine(strings: [string, string]): State {
   const buffers = strings.map((v) => Buffer.from(v, 'base64'));
   const {length} = Buffer.concat(buffers);
   const buffer = Buffer.alloc(length);
   // eslint-disable-next-line no-plusplus
   for (let i = 0; i < length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      buffer[i] = buffers[i % 2][Math.floor(i / 2)];
   }

   const decoded: unknown = JSON.parse(brotliDecompressSync(buffer).toString());

   if (!isState(decoded)) {
      throw new ErrorContext(new Error('Given strings are not SAML state'), {
         source: `[sso] (${__filename})`,
         httpStatusCode: StatusCodes.BAD_REQUEST,
         strings,
      });
   }
   return decoded;
}
