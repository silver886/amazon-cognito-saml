/* eslint-disable import/max-dependencies */
import {randomUUID} from 'crypto';
import {ErrorContext} from '@silver886/error-context';
import {StatusCodes} from 'http-status-codes';
import {decode} from 'jsonwebtoken';
import {Constants, SamlLib} from 'samlify';
import {COOKIE_SECRET, CookieName, OIDC_CLIENT_CALLBACK_URL, SAML_IDENTITY_PROVIDERS, SAML_IDENTITY_PROVIDER_ASSERTION_LIFE_TIME, SAML_SERVICE_PROVIDERS, getOidcClient} from '@@src/config';
import {randomSelect} from '@@src/utils/array';
import {decrypt} from '@@src/utils/crypto';
import {combine} from '@@src/utils/saml';
import type {OidcController} from '@@src/controllers/oidc';
import type {CompositeRequest} from '@@src/models/common';
import type {Response} from 'express';

// eslint-disable-next-line max-lines-per-function, max-statements
export async function callback(
    controller: OidcController,
    request: CompositeRequest,
    response: Response,
): Promise<OidcController> {
    try {
        const signedCookies = request.signedCookies as Record<string, string | false>;
        if (!(CookieName.SAML_STATE in signedCookies)) {
            throw new ErrorContext(new Error('Session is empty'), {
                source:         `[callback] (${__filename})`,
                httpStatusCode: StatusCodes.BAD_REQUEST,
                signedCookies,
            });
        }

        const samlState = signedCookies[CookieName.SAML_STATE];
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (!samlState) {
            throw new ErrorContext(new Error('Session is malformed'), {
                source:         `[callback] (${__filename})`,
                httpStatusCode: StatusCodes.BAD_REQUEST,
                samlState,
            });
        }

        const {state, nonce} = JSON.parse(decrypt(COOKIE_SECRET, samlState)) as {
            state: string;
            nonce: string;
        };

        const {id_token:userIdToken} = await (await getOidcClient()).
            callback(OIDC_CLIENT_CALLBACK_URL, (await getOidcClient()).
                callbackParams(request), {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                response_type: 'code',
                state,
                nonce,
            });
        if (!userIdToken) {
            throw new ErrorContext(new Error('User ID token is empty'), {
                source:         `[callback] (${__filename})`,
                httpStatusCode: StatusCodes.BAD_REQUEST,
            });
        }

        const userInfo = decode(userIdToken, {json: true}) as {
            /* eslint-disable @typescript-eslint/naming-convention */
            'cognito:username': string;
            'cognito:groups': [string];
            'name': string;
            'email': string;
            /* eslint-enable @typescript-eslint/naming-convention */
        };
        const {serviceProviderId, loginRequest, ssoService, requestId, relayState} = combine([state, nonce]);

        const idp = SAML_IDENTITY_PROVIDERS[serviceProviderId];
        const sp = SAML_SERVICE_PROVIDERS[serviceProviderId];

        const now = new Date();
        const lifeTime = new Date(now.getTime() + SAML_IDENTITY_PROVIDER_ASSERTION_LIFE_TIME);

        const {context} = await idp.createLoginResponse(
            sp,
            loginRequest,
            Object.entries(Constants.namespace.binding).
                filter(([_, value]) => value === ssoService.binding).
                map(([key]) => key).
                join(),
            {},
            (template: string) => ({
                id:      request.id,
                context: SamlLib.replaceTagsByValue(template, {
                    /* eslint-disable @typescript-eslint/naming-convention */
                    ID:                                  request.id,
                    AssertionID:                         request.id,
                    InResponseTo:                        requestId,
                    Audience:                            sp.entityMeta.getEntityID(),
                    EntityID:                            sp.entityMeta.getEntityID(),
                    Destination:                         ssoService.location,
                    AssertionConsumerServiceURL:         ssoService.location,
                    SubjectRecipient:                    ssoService.location,
                    Issuer:                              idp.entityMeta.getEntityID(),
                    IssueInstant:                        now.toISOString(),
                    ConditionsNotBefore:                 now.toISOString(),
                    ConditionsNotOnOrAfter:              lifeTime.toISOString(),
                    SubjectConfirmationDataNotOnOrAfter: lifeTime.toISOString(),
                    StatusCode:                          Constants.StatusCode.Success,
                    NameIDFormat:                        randomSelect(['idpNameIdFormat']),
                    NameID:                              randomUUID(),
                    attrUserId:                          userInfo['cognito:username'],
                    attrUserEmail:                       userInfo.email,
                    attrUserName:                        userInfo.name,
                    attrUserGroups:                      userInfo['cognito:groups'],
                    /* eslint-enable @typescript-eslint/naming-convention */
                }),
            }),
        ) as {
            context: string;
        };

        response.setHeader('Content-Security-Policy', `script-src 'unsafe-inline'; form-action ${ssoService.location};`);
        response.send(`<!DOCTYPE html>
            <html>
                <body>
                    <h1>Redirecting you back to where you come from . . .</h1>
                    <form id="sso" method="post" action="${ssoService.location}" autocomplete="off">
                        <input type="hidden" name="SAMLResponse" id="resp" value="${context}" />
                        <input type="hidden" name="RelayState" id="resp" value="${relayState}" />
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
            source:         `[callback] (${__filename})`,
            httpStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            controller,
            request,
            response,
        });
    }
}
