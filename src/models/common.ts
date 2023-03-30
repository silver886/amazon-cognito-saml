import type {Request as ExpressRequest} from 'express';

export interface BasicRequest {
   /**
    * Request ID set by `express-request-id` middleware.
    */
   id: string;
}

export type CompositeRequest = BasicRequest & ExpressRequest;

/**
 * Basic response body.
 */
export interface BasicResponse {
   /**
    * Request ID set by `express-request-id` middleware.
    */
   requestId: string;
}
