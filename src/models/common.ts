import type {Request as ExpressRequest} from 'express';

export type CompositeRequest = ExpressRequest & {
   /**
    * Request ID set by `express-request-id` middleware.
    */
   id: string;
};

/**
 * Basic response body.
 */
export interface BasicResponse {
   /**
    * Request ID set by `express-request-id` middleware.
    */
   requestId: string;
}
