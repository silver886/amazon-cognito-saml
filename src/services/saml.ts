import {ErrorContext} from '@silver886/error-context';
import {StatusCodes} from 'http-status-codes';
import {lookup} from 'mime-types';
import {COOKIE_SECRET, CookieName, SAML_IDENTITY_PROVIDERS, SAML_SERVICE_PROVIDERS, getOidcClient} from '@@src/config';
import {randomSelect} from '@@src/utils/array';
import {encrypt} from '@@src/utils/crypto';
import {divide} from '@@src/utils/saml';
import type {SamlController} from '@@src/controllers/saml';
import type {CompositeRequest} from '@@src/models/common';
import type {Response} from 'express';

export function metadata(
    controller: SamlController,
    response: Response,
    serviceProviderId: string,
): SamlController {
    try {
        controller.setStatus(StatusCodes.OK);
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        response.contentType(lookup('xml') || '');
        response.send(SAML_IDENTITY_PROVIDERS[serviceProviderId].getMetadata());

        return controller;
    } catch (err) {
        throw new ErrorContext(err instanceof Error ? err : new Error(err as string), {
            source:         `[metadata] (${__filename})`,
            httpStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            controller,
            response,
            serviceProviderId,
        });
    }
}

// eslint-disable-next-line max-lines-per-function, max-statements
export async function sso(
    controller: SamlController,
    express: {
        request: CompositeRequest;
        response: Response;
    },
    props: {
        binding: string;
        serviceProviderId: string;
        relayState: string;
    },
): Promise<SamlController> {
    try {
        const idp = SAML_IDENTITY_PROVIDERS[props.serviceProviderId];
        const sp = SAML_SERVICE_PROVIDERS[props.serviceProviderId];

        const idpNameIdFormat = idp.entitySetting.nameIDFormat;
        if (!idpNameIdFormat) {
            throw new ErrorContext(new Error('Name ID format of identity provider is empty'), {
                source:                  `[sso] (${__filename})`,
                httpStatusCode:          StatusCodes.INTERNAL_SERVER_ERROR,
                identityProviderSetting: idp.entitySetting,
            });
        }

        const loginInfo = await idp.parseLoginRequest(sp, props.binding, express.request);
        const {id: spRequestId, assertionConsumerServiceUrl: spRequestAcsUrl} = (loginInfo.extract as {
            request: {
                id: string;
                assertionConsumerServiceUrl?: string;
            };
        }).request;

        const spAcs = sp.entitySetting.assertionConsumerService;
        if (!spAcs) {
            throw new ErrorContext(new Error('Assertion consumer service of service provider is empty'), {
                source:                 `[sso] (${__filename})`,
                httpStatusCode:         StatusCodes.INTERNAL_SERVER_ERROR,
                serviceProviderSetting: sp.entitySetting,
            });
        }
        const filteredSpAcs = spAcs.filter((v) => v.Location === spRequestAcsUrl);
        const {
            Binding:spServiceBinding,
            Location:spServiceLocation,
        } = randomSelect(filteredSpAcs.length ? filteredSpAcs : spAcs);

        const [state, nonce] = divide({
            serviceProviderId: props.serviceProviderId,
            loginRequest:      loginInfo,
            ssoService:        {
                binding:  spServiceBinding,
                location: spServiceLocation,
            },
            requestId:  spRequestId,
            relayState: props.relayState,
        });

        controller.setStatus(StatusCodes.TEMPORARY_REDIRECT);
        express.response.cookie(CookieName.SAML_STATE, encrypt(COOKIE_SECRET, JSON.stringify({
            state,
            nonce,
        })), {
            signed:   true,
            httpOnly: true,
            secure:   true,
        });
        express.response.location((await getOidcClient()).authorizationUrl({
            scope: 'openid profile',
            state,
            nonce,
        }));

        return controller;
    } catch (err) {
        throw new ErrorContext(err instanceof Error ? err : new Error(err as string), {
            source:         `[sso] (${__filename})`,
            httpStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            controller,
            express,
            props,
        });
    }
}
