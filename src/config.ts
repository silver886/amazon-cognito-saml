import {env} from 'process';
import {validate} from '@authenio/samlify-node-xmllint';
import dotenv from 'dotenv';
import {Issuer} from 'openid-client';
import {
   Constants,
   IdentityProviderInstance,
   SamlLib,
   ServiceProviderInstance,
   setSchemaValidator,
} from 'samlify';
import type {BaseClient} from 'openid-client';
import type {IdentityProviderSettings} from 'samlify/types/src/types';

dotenv.config();

export enum ExitCode {
   SIGINT_SERVER_CLOSE = 2,
   SIGINT_SERVER_CLOSE_FAIL = 3,
   CRASH = 255,
}

export enum HeaderName {
   REQUEST_ID = 'X-Request-ID',
}

export enum CookieName {
   SAML_STATE = 'saml-state',
}

export const HOST = (env.HOST ?? '') || '127.0.0.1';
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
export const PORT = parseInt(env.PORT ?? '', 10) || 8080;

const BASE_URL = (env.BASE_URL ?? '') || 'https://example.com';

export const COOKIE_SECRET =
   (env.COOKIE_SECRET ?? '') || 'this-is-not-a-safe-secret-to-use';

const OIDC_CLIENT_BASE_URL = `${BASE_URL}/oidc`;

export const OIDC_CLIENT_CALLBACK_URL = `${OIDC_CLIENT_BASE_URL}/callback`;

if (!env.AWS_COGNITO_REGION) {
   throw new Error("AWS_COGNITO_REGION shouldn't be empty");
}
if (!env.AWS_COGNITO_USER_POOL_ID) {
   throw new Error("AWS_COGNITO_USER_POOL_ID shouldn't be empty");
}
if (!env.AWS_COGNITO_CLIENT_ID) {
   throw new Error("AWS_COGNITO_CLIENT_ID shouldn't be empty");
}
if (!env.AWS_COGNITO_CLIENT_SECRET) {
   throw new Error("AWS_COGNITO_CLIENT_SECRET shouldn't be empty");
}
const {
   AWS_COGNITO_REGION,
   AWS_COGNITO_USER_POOL_ID,
   AWS_COGNITO_CLIENT_ID,
   AWS_COGNITO_CLIENT_SECRET,
} = env;

let AWS_COGNITO_CLIENT: BaseClient | null = null;
export async function getOidcClient(): Promise<BaseClient> {
   if (AWS_COGNITO_CLIENT) {
      return AWS_COGNITO_CLIENT;
   }

   // eslint-disable-next-line require-atomic-updates
   AWS_COGNITO_CLIENT = new (
      await Issuer.discover(
         `https://cognito-idp.${AWS_COGNITO_REGION}.amazonaws.com/${AWS_COGNITO_USER_POOL_ID}/.well-known/openid-configuration`,
      )
   ).Client({
      /* eslint-disable @typescript-eslint/naming-convention */
      client_id: AWS_COGNITO_CLIENT_ID,
      client_secret: AWS_COGNITO_CLIENT_SECRET,
      redirect_uris: [
         OIDC_CLIENT_CALLBACK_URL,
      ],
      response_types: [
         'code',
      ],
      /* eslint-enable @typescript-eslint/naming-convention */
   });
   return AWS_COGNITO_CLIENT;
}

const SAML_IDENTITY_PROVIDER_BASE_URL = `${BASE_URL}/saml`;

// Condition grace time in milliseconds.
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
export const SAML_IDENTITY_PROVIDER_CONDITION_GRACE_TIME = 15 * 1000;

// Assertion life time in milliseconds.
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
export const SAML_IDENTITY_PROVIDER_ASSERTION_LIFE_TIME = 5 * 60 * 1000;

if (!env.SAML_IDENTITY_PROVIDER_CERTIFICATE) {
   throw new Error("SAML_IDENTITY_PROVIDER_CERTIFICATE shouldn't be empty");
}
if (!env.SAML_IDENTITY_PROVIDER_PRIVATE_KEY) {
   throw new Error("SAML_IDENTITY_PROVIDER_PRIVATE_KEY shouldn't be empty");
}
const {SAML_IDENTITY_PROVIDER_CERTIFICATE, SAML_IDENTITY_PROVIDER_PRIVATE_KEY} =
   env;

setSchemaValidator({validate});

const SAML_IDENTITY_PROVIDER_SETTINGS: IdentityProviderSettings = {
   /* eslint-disable @typescript-eslint/naming-convention */
   entityID: `${SAML_IDENTITY_PROVIDER_BASE_URL}/metadata`,

   requestSignatureAlgorithm: Constants.algorithms.signature.RSA_SHA512,
   signingCert: SAML_IDENTITY_PROVIDER_CERTIFICATE,
   privateKey: SAML_IDENTITY_PROVIDER_PRIVATE_KEY,

   singleSignOnService: [
      {
         Binding: Constants.BindingNamespace.Redirect,
         Location: `${SAML_IDENTITY_PROVIDER_BASE_URL}/sso`,
      },
      {
         Binding: Constants.BindingNamespace.Post,
         Location: `${SAML_IDENTITY_PROVIDER_BASE_URL}/sso`,
      },
   ],

   nameIDFormat: [
      Constants.namespace.format.transient,
   ],

   loginResponseTemplate: {
      ...SamlLib.defaultLoginResponseTemplate,
      context: SamlLib.defaultLoginResponseTemplate.context.replace(
         /\{AuthnStatement\}/giu,
         `<saml:AuthnStatement AuthnInstant="{AuthnInstant}" SessionNotOnOrAfter="{SessionNotOnOrAfter}" SessionIndex="{SessionIndex}"><saml:AuthnContext><saml:AuthnContextClassRef>${Constants.namespace.authnContextClassRef.passwordProtectedTransport}</saml:AuthnContextClassRef></saml:AuthnContext></saml:AuthnStatement>`,
      ),
      attributes: [
         {
            /* spell-checker: disable */
            name: 'id',
            valueTag: 'user.id',
            nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
            valueXsiType: 'xs:string',
         },
         {
            name: 'email',
            valueTag: 'user.email',
            nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
            valueXsiType: 'xs:string',
         },
         {
            name: 'name',
            valueTag: 'user.name',
            nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
            valueXsiType: 'xs:string',
         },
         {
            name: 'groups',
            valueTag: 'user.groups',
            nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
            valueXsiType: 'xs:string',
            /* spell-checker: enable */
         },
      ],
   },
   /* eslint-enable @typescript-eslint/naming-convention */
};

interface SsoServiceEnv {
   isDefault: string;
   binding: string;
   location: string;
}

interface SamlServiceProviderEnv {
   id: string;
   entityId: string;
   assertionConsumerService: Record<string, SsoServiceEnv | null>;
   singleLogoutService: Record<string, SsoServiceEnv | null>;
}

// eslint-disable-next-line max-params
function mergeSsoServiceEnv(
   envNamePattern: RegExp,
   envName: string,
   value: string,
   target?: Record<string, SsoServiceEnv | null>,
): Record<string, SsoServiceEnv | null> {
   const {id, key} = envNamePattern.exec(envName)?.groups ?? {
      id: null,
      key: null,
   };
   if (!id || !key) return target ?? {};
   return {
      ...target,
      [id]: {
         isDefault:
            key === 'IS_DEFAULT'
               ? value
               : target
               ? target[id]?.isDefault ?? ''
               : '',
         binding:
            key === 'BINDING' ? value : target ? target[id]?.binding ?? '' : '',
         location:
            key === 'LOCATION'
               ? value
               : target
               ? target[id]?.location ?? ''
               : '',
      },
   };
}

// eslint-disable-next-line max-params
function mergeSamlServiceProviderEnv(
   envNamePattern: RegExp,
   envName: string,
   value?: string,
   target?: Record<string, SamlServiceProviderEnv | null>,
): Record<string, SamlServiceProviderEnv | null> {
   const {id, key} = envNamePattern.exec(envName)?.groups ?? {
      id: null,
      key: null,
   };
   if (!id || !key || !value) return target ?? {};
   return {
      ...target,
      [id]: {
         id: key === 'ID' ? value : target ? target[id]?.id ?? '' : '',
         entityId:
            key === 'ENTITY_ID'
               ? value
               : target
               ? target[id]?.entityId ?? ''
               : '',
         assertionConsumerService: mergeSsoServiceEnv(
            /^ASSERTION_CONSUMER_SERVICE_(?<id>\d+)_(?<key>.*)$/giu,
            key,
            value,
            target ? target[id]?.assertionConsumerService ?? {} : {},
         ),
         singleLogoutService: mergeSsoServiceEnv(
            /^SINGLE_LOGOUT_SERVICE_(?<id>\d+)_(?<key>.*)$/giu,
            key,
            value,
            target ? target[id]?.singleLogoutService ?? {} : {},
         ),
      },
   };
}

export const SAML_SERVICE_PROVIDERS: Record<string, ServiceProviderInstance> =
   Object.fromEntries(
      (
         Object.values(
            // eslint-disable-next-line max-lines-per-function
            ((): Record<string, SamlServiceProviderEnv | null> => {
               let output: Record<string, SamlServiceProviderEnv | null> = {};

               Object.entries(env)
                  .filter(
                     ([
                        k,
                     ]) => k.startsWith('SAML_SERVICE_PROVIDER_'),
                  )
                  .forEach(
                     ([
                        k,
                        v,
                     ]) => {
                        output = mergeSamlServiceProviderEnv(
                           /^SAML_SERVICE_PROVIDER_(?<id>\d+)_(?<key>.*)$/giu,
                           k,
                           v,
                           output,
                        );
                     },
                  );

               return output;
            })(),
         ).filter((v) => v) as SamlServiceProviderEnv[]
      ).map((v) => [
         v.id,
         new ServiceProviderInstance({
            /* eslint-disable @typescript-eslint/naming-convention */
            entityID: v.entityId,
            assertionConsumerService: (
               Object.values(v.assertionConsumerService).filter(
                  (w) => w,
               ) as SsoServiceEnv[]
            ).map((w) => ({
               isDefault: /^true$/giu.test(w.isDefault),
               Binding: w.binding,
               Location: w.location,
            })),
            singleLogoutService: (
               Object.values(v.singleLogoutService).filter(
                  (w) => w,
               ) as SsoServiceEnv[]
            ).map((w) => ({
               isDefault: /^true$/giu.test(w.isDefault),
               Binding: w.binding,
               Location: w.location,
            })),
            /* eslint-enable @typescript-eslint/naming-convention */
         }),
      ]),
   );

export const SAML_IDENTITY_PROVIDERS: Record<string, IdentityProviderInstance> =
   Object.fromEntries(
      Object.keys(SAML_SERVICE_PROVIDERS).map((v) => [
         v,
         new IdentityProviderInstance({
            ...SAML_IDENTITY_PROVIDER_SETTINGS,
            /* eslint-disable @typescript-eslint/naming-convention */
            entityID: `${
               SAML_IDENTITY_PROVIDER_SETTINGS.entityID ?? ''
            }?spId=${v}`,
            singleSignOnService:
               SAML_IDENTITY_PROVIDER_SETTINGS.singleSignOnService?.map(
                  (w) => ({
                     ...w,
                     Location: `${w.Location}?spId=${v}`,
                     /* eslint-enable @typescript-eslint/naming-convention */
                  }),
               ),
         }),
      ]),
   );
