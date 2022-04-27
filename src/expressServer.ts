/* eslint-disable import/no-nodejs-modules */
/* eslint-disable import/max-dependencies */
import http from 'http';
import {ErrorContext} from '@silver886/error-context';
import {ValidateError} from '@tsoa/runtime';
import bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, {Router as router} from 'express';
import requestId from 'express-request-id';
import helmet from 'helmet';
import {StatusCodes} from 'http-status-codes';
import {getAbsoluteFSPath} from 'swagger-ui-dist';
import swaggerUI from 'swagger-ui-express';
import {HeaderName} from './config';
import swagger from './openapi/swagger.json'; // eslint-disable-line import/extensions
import {RegisterRoutes as registerRoutes} from './routes/routes';
import type {Express, NextFunction, Request, Response} from 'express';
import type {Server} from 'http';
import type {JsonObject} from 'swagger-ui-express';

// eslint-disable-next-line max-statements
export const APP = ((): Express => {
    const app = express();

    app.use(cors({
        credentials: true,
    }));
    app.use(bodyParser.json({
        limit: '8MB',
    }));
    app.use(bodyParser.text());
    app.use(express.json());
    app.use(express.urlencoded({
        extended: false,
    }));
    app.use(helmet());
    app.use(compression());
    app.use(cookieParser());
    app.use(requestId({
        setHeader:  true,
        headerName: HeaderName.REQUEST_ID,
    }));

    app.use(express.static(getAbsoluteFSPath()));

    const routing = router();
    routing.use('/api-doc', swaggerUI.serve, swaggerUI.setup(swagger as JsonObject, {customCss: '.swagger-ui .curl-command {display:none;}'}));
    registerRoutes(routing);

    app.use('/', routing);

    // eslint-disable-next-line consistent-return, max-params, @typescript-eslint/no-invalid-void-type
    app.use((err: unknown, req: Request, res: Response, next: NextFunction): Response | void => {
        if (err instanceof ValidateError) {
            // eslint-disable-next-line no-console
            console.error(`Caught Validation Error for ${req.path}:`, err);
            return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
                message: 'Validation Failed',
                details: err.fields,
            });
        }

        if (err instanceof ErrorContext) {
            // eslint-disable-next-line no-console
            console.error(`Caught Internal Server Error for ${req.path}:`, err);
            return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
                requestId: err.context.requestId,
                message:   'Service Unavailable',
            });
        }

        if (err instanceof Error) {
            // eslint-disable-next-line no-console
            console.error(`Caught Unknown Error for ${req.path}:`, err);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: 'Internal Server Error',
            });
        }

        next();
    });

    return app;
})();

// eslint-disable-next-line max-statements
export function expressServer(): Server {
    const server = http.createServer(APP);
    return server;
}
