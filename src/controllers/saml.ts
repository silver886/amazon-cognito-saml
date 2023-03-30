/* eslint-disable new-cap */
import {ErrorContext} from '@silver886/error-context';
import {
   Controller,
   Example,
   Get,
   Post,
   Query,
   Request,
   Response,
   Route,
   Tags,
} from '@tsoa/runtime';
import {StatusCodes} from 'http-status-codes';
import {Constants} from 'samlify';
import {SAML_SERVICE_PROVIDERS} from '@@src/config';
import {CompositeRequest} from '@@src/models/common';
import {metadata, sso} from '@@src/services/saml';
import type {BasicResponse} from '@@src/models/common';
import type {Response as ExpressResponse} from 'express';

@Route('saml')
@Tags('SAML')
export class SamlController extends Controller {
   private static check(
      caller: string,
      request: CompositeRequest,
      spId: string,
   ): {
      response: ExpressResponse;
      serviceProviderId: string;
   } {
      const response = request.res;
      if (!response) {
         throw new ErrorContext(new Error('Response is undefined'), {
            requestId: request.id,
            source: `[${caller}] (${__filename})`,
            httpStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            request,
         });
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
      if (!SAML_SERVICE_PROVIDERS[spId]) {
         throw new ErrorContext(
            new Error('Service provider ID is not recognized'),
            {
               requestId: request.id,
               source: `[${caller}] (${__filename})`,
               httpStatusCode: StatusCodes.BAD_REQUEST,
               request,
            },
         );
      }

      return {
         response,
         serviceProviderId: spId,
      };
   }

   /**
    * Response SAML metadata of IdP.
    */
   /* spell-checker: disable */
   @Example<string>(`
        <EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
            xmlns:assertion="urn:oasis:names:tc:SAML:2.0:assertion"
            xmlns:ds="http://www.w3.org/2000/09/xmldsig#" entityID="https://idp.example.com/saml/metadata">
            <IDPSSODescriptor WantAuthnRequestsSigned="false" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
                <KeyDescriptor use="signing">
                    <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
                        <ds:X509Data>
                            <ds:X509Certificate>MIISOMECERTSM9Xvw==</ds:X509Certificate>
                        </ds:X509Data>
                    </ds:KeyInfo>
                </KeyDescriptor>
                <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
                <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://idp.example.com/saml/sso"></SingleSignOnService>
                <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://idp.example.com/saml/sso"></SingleSignOnService>
            </IDPSSODescriptor>
        </EntityDescriptor>`)
   /* spell-checker: enable */
   @Response<BasicResponse & {message: string}>(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Internal server error',
      {
         requestId: '15ea85ec-2433-4d49-99a0-ca91523fbdce',
         message: 'Internal Server Error',
      },
   )
   @Get('/metadata')
   public getMetadata(
      @Request() request: CompositeRequest,
      @Query() spId: string,
   ): SamlController {
      try {
         const {response, serviceProviderId} = SamlController.check(
            'metadata',
            request,
            spId,
         );

         return metadata(this, response, serviceProviderId);
      } catch (err) {
         throw new ErrorContext(
            err instanceof Error ? err : new Error(err as string),
            {
               requestId: request.id,
               source: `[getMetadata] (${__filename})`,
               request,
               spId,
            },
         );
      }
   }

   /**
    * Perform single sign on.
    */
   @Response<BasicResponse & {message: string}>(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Internal server error',
      {
         requestId: '77d49934-fa07-4f84-a80a-b8faf289d7f9',
         message: 'Internal Server Error',
      },
   )
   @Get('/sso')
   public async getSso(
      @Request() request: CompositeRequest,
      @Query() spId: string,
   ): Promise<SamlController> {
      try {
         const {response, serviceProviderId} = SamlController.check(
            'getSso',
            request,
            spId,
         );
         const relayState =
            request.query[Constants.wording.urlParams.relayState];

         return await sso(
            this,
            {
               request,
               response,
            },
            {
               binding: Constants.wording.binding.redirect,
               serviceProviderId,
               relayState: typeof relayState === 'string' ? relayState : '',
            },
         );
      } catch (err) {
         throw new ErrorContext(
            err instanceof Error ? err : new Error(err as string),
            {
               requestId: request.id,
               source: `[getSso] (${__filename})`,
               request,
               spId,
            },
         );
      }
   }

   /**
    * Perform single sign on.
    */
   @Response<BasicResponse & {message: string}>(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Internal server error',
      {
         requestId: '9d9e5b39-8d11-49c0-9a40-de7395949532',
         message: 'Internal Server Error',
      },
   )
   @Post('/sso')
   public async postSso(
      @Request() request: CompositeRequest,
      @Query() spId: string,
   ): Promise<SamlController> {
      try {
         const {response, serviceProviderId} = SamlController.check(
            'postSso',
            request,
            spId,
         );
         const relayState =
            request.query[Constants.wording.urlParams.relayState];

         return await sso(
            this,
            {
               request,
               response,
            },
            {
               binding: Constants.wording.binding.post,
               serviceProviderId,
               relayState: typeof relayState === 'string' ? relayState : '',
            },
         );
      } catch (err) {
         throw new ErrorContext(
            err instanceof Error ? err : new Error(err as string),
            {
               requestId: request.id,
               source: `[postSso] (${__filename})`,
               request,
               spId,
            },
         );
      }
   }
}
