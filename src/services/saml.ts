import {randomUUID} from 'crypto';
import {ErrorContext} from '@silver886/error-context';
import {StatusCodes} from 'http-status-codes';
import {lookup} from 'mime-types';
import {Constants, SamlLib} from 'samlify';
import {SAML_IDENTITY_PROVIDER_ASSERTION_LIFE_TIME, SAML_SERVICE_PROVIDERS} from '@@src/config';
import {randomSelect} from '@@src/utils/array';
import {generateIdp} from '@@src/utils/saml';
import type {SamlController} from '@@src/controllers/saml';
import type {CompositeRequest} from '@@src/models/common';
import type {Response} from 'express';

export function metadata(
    controller: SamlController,
    express: {
        request: CompositeRequest;
        response: Response;
    }, props: {
        serviceProviderId: string;
    },
): SamlController {
    try {
        controller.setStatus(StatusCodes.OK);
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        express.response.contentType(lookup('xml') || '');
        express.response.send(generateIdp(props.serviceProviderId).getMetadata());

        return controller;
    } catch (err) {
        throw new ErrorContext(err instanceof Error ? err : new Error(err as string), {
            requestId:      express.request.id,
            source:         `[metadata] (${__filename})`,
            httpStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            controller,
            express,
            props,
        });
    }
}

// eslint-disable-next-line max-len, max-lines-per-function, max-params, max-statements
export async function sso(
    controller: SamlController,
    express: {
        request: CompositeRequest;
        response: Response;
    }, props: {
        binding: string;
        serviceProviderId: string;
        relayState: string;
    },
): Promise<SamlController> {
    try {
        const idp = generateIdp(props.serviceProviderId);
        const sp = SAML_SERVICE_PROVIDERS[props.serviceProviderId];

        const idpNameIdFormat = idp.entitySetting.nameIDFormat;
        if (!idpNameIdFormat) {
            throw new ErrorContext(new Error('Name ID format of identity provider is empty'), {
                requestId:               express.request.id,
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
                requestId:              express.request.id,
                source:                 `[sso] (${__filename})`,
                httpStatusCode:         StatusCodes.INTERNAL_SERVER_ERROR,
                serviceProviderSetting: sp.entitySetting,
            });
        }
        const filteredSpAcs = spAcs.filter((v) => v.Location === spRequestAcsUrl);
        const spService = randomSelect(filteredSpAcs.length ? filteredSpAcs : spAcs);

        const now = new Date();
        const lifeTime = new Date(now.getTime() + SAML_IDENTITY_PROVIDER_ASSERTION_LIFE_TIME);

        const resp = await idp.createLoginResponse(
            sp,
            loginInfo,
            Object.entries(Constants.namespace.binding).
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                filter(([_, value]) => value === spService.Binding).
                map(([key]) => key).
                join(),
            {},
            (template: string) => ({
                id:      express.request.id,
                context: SamlLib.replaceTagsByValue(template, {
                    /* eslint-disable @typescript-eslint/naming-convention */
                    ID:                                  express.request.id,
                    AssertionID:                         express.request.id,
                    InResponseTo:                        spRequestId,
                    Audience:                            sp.entityMeta.getEntityID(),
                    EntityID:                            sp.entityMeta.getEntityID(),
                    Destination:                         spService.Location,
                    AssertionConsumerServiceURL:         spService.Location,
                    SubjectRecipient:                    spService.Location,
                    Issuer:                              idp.entityMeta.getEntityID(),
                    IssueInstant:                        now.toISOString(),
                    ConditionsNotBefore:                 now.toISOString(),
                    ConditionsNotOnOrAfter:              lifeTime.toISOString(),
                    SubjectConfirmationDataNotOnOrAfter: lifeTime.toISOString(),
                    StatusCode:                          Constants.StatusCode.Success,
                    NameIDFormat:                        randomSelect(idpNameIdFormat),
                    NameID:                              randomUUID(),
                    attrUserEmail:                       'yoyoyo@example.com',
                    attrUserName:                        'YO',
                    attrUserRole:                        'admin',
                    attrUserOrg:                         'example.com',
                    attrUserGroup:                       'L1;funny',
                    /* eslint-enable @typescript-eslint/naming-convention */
                }),
            }),
        ) as {
            context: string;
        };

        express.response.setHeader('Content-Security-Policy', `script-src 'unsafe-inline'; form-action ${spService.Location};`);
        express.response.send(`<!DOCTYPE html>
            <html>
                <body>
                    <h1>Redirecting you back to where you come from . . .</h1>
                    <form id="sso" method="post" action="${spService.Location}" autocomplete="off">
                        <input type="hidden" name="SAMLResponse" id="resp" value="${resp.context}" />
                        <input type="hidden" name="RelayState" id="resp" value="${props.relayState}" />
                    </form>
                    <script>
                        window.onload = function () {
                            document.forms[0].submit();
                        };
                    </script>
                </body>
            </html>`);

        return controller;
    } catch (err) {
        throw new ErrorContext(err instanceof Error ? err : new Error(err as string), {
            requestId:      express.request.id,
            source:         `[sso] (${__filename})`,
            httpStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            controller,
            express,
            props,
        });
    }
}
