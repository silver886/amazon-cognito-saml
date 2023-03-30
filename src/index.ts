import {env, exit} from 'process';
import {inspect} from 'util';
import {configure} from '@vendia/serverless-express';
import {ExitCode, HOST, PORT} from './config';
import {APP, expressServer} from './expressServer';
import type {Server} from 'http';
import type {AddressInfo} from 'net';

inspect.defaultOptions.depth = null;

type LambdaHandler = (event: unknown, context: unknown) => unknown;

let SERVERLESS_EXPRESS_INSTANCE: LambdaHandler | null = null;

function setup(event: unknown, context: unknown): unknown {
   SERVERLESS_EXPRESS_INSTANCE = configure({
      app: APP,
   }) as unknown as LambdaHandler;
   // eslint-disable-next-line new-cap
   return SERVERLESS_EXPRESS_INSTANCE(event, context);
}

export function handler(event: unknown, context: unknown): unknown {
   if (SERVERLESS_EXPRESS_INSTANCE) {
      // eslint-disable-next-line new-cap
      return SERVERLESS_EXPRESS_INSTANCE(event, context);
   }
   return setup(event, context);
}

process.on('uncaughtException', (err) => {
   // eslint-disable-next-line no-console
   console.error(err);
});

if (env.NODE_ENV === 'local') {
   ((): void => {
      let httpServer: Server | null = null;

      process.on('SIGINT', () => {
         // eslint-disable-next-line no-console
         console.log('SIGINT signal received');

         // eslint-disable-next-line no-console
         console.log('Closing server . . .');
         httpServer?.close((err) => {
            try {
               if (err) throw err;
               // eslint-disable-next-line no-console
               console.log('Server closed');

               exit(ExitCode.SIGINT_SERVER_CLOSE);
            } catch (error) {
               // eslint-disable-next-line no-console
               console.error(error);
               // eslint-disable-next-line no-console
               console.error('Server close failed');
               exit(ExitCode.SIGINT_SERVER_CLOSE_FAIL);
            }
         });
      });

      try {
         const server = expressServer();
         httpServer = server;
         server.listen(PORT, HOST, () => {
            const serverAddress = server.address() as AddressInfo;
            // eslint-disable-next-line no-console
            console.log(
               `Server (${APP.get('env') as string}) start listening on: ${
                  serverAddress.address
               }:${serverAddress.port}`,
            );
         });
      } catch (err) {
         // eslint-disable-next-line no-console
         console.error(err);
         // eslint-disable-next-line no-console
         console.error('Server crashed');
         exit(ExitCode.CRASH);
      }
   })();
}
