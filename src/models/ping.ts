/**
 * Request body for `ping`.
 */
export interface PingRequestBody {

    /**
     * Will be in the response body.
     */
    readonly echo: string;
}

/**
 * Response of `ping`.
 */
export interface PingResponse {

    /**
     * The same string from request body's `echo`.
     */
    readonly echo: string;

    /**
     * Server information.
     */
    readonly server: {

        /**
         * IP address.
         */
        readonly ip: string;

        /**
         * PTR record of the IP address.
         */
        readonly ptr: string;
    };
}
