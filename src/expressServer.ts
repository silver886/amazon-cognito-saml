/* eslint-disable import/no-nodejs-modules */
/* eslint-disable import/max-dependencies */
import {randomUUID} from 'crypto';
import {readFileSync} from 'fs';
import http from 'http';
import {join} from 'path';
import {validate} from '@authenio/samlify-node-xmllint';
import {ErrorContext} from '@silver886/error-context';
import {ValidateError} from '@tsoa/runtime';
import bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import requestId from 'express-request-id';
import helmet from 'helmet';
import {StatusCodes} from 'http-status-codes';
import {Constants, IdentityProviderInstance, SamlLib, ServiceProviderInstance, setSchemaValidator} from 'samlify';
import {HeaderName} from './config';
import type {Express, NextFunction, Request, Response} from 'express';
import type {Server} from 'http';

// eslint-disable-next-line max-statements, max-lines-per-function
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

    setSchemaValidator({validate});

    const idp = new IdentityProviderInstance({
        entityID: 'll-dev',

        requestSignatureAlgorithm: Constants.algorithms.signature.RSA_SHA1,

        /*
         * LoginResponseTemplate?: LoginResponseTemplate;
         * logoutRequestTemplate?: SAMLDocumentTemplate;
         */
        signingCert: readFileSync(join(__dirname, '..', 'cert.pem')),
        privateKey:  readFileSync(join(__dirname, '..', 'key.pem')),

        singleSignOnService: [{
            Binding:  Constants.BindingNamespace.Redirect,
            Location: 'http://127.0.0.1:8080/sso',
        }],

        nameIDFormat: [Constants.namespace.format.emailAddress],

        loginResponseTemplate: {
            ...SamlLib.defaultLoginResponseTemplate,
            attributes: [{
                name:         'role',
                valueTag:     'user.role',
                nameFormat:   'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
                valueXsiType: 'xs:string',
            }, {
                name:         'name',
                valueTag:     'user.name',
                nameFormat:   'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
                valueXsiType: 'xs:string',
            }, {
                name:         'email',
                valueTag:     'user.email',
                nameFormat:   'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
                valueXsiType: 'xs:string',
            }, {
                name:         'org',
                valueTag:     'user.org',
                nameFormat:   'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
                valueXsiType: 'xs:string',
            }, {
                name:         'ttl',
                valueTag:     'user.ttl',
                nameFormat:   'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
                valueXsiType: 'xs:string',
            }],
        },
    });

    new ServiceProviderInstance({
        metadata: `
<!-- This is the metadata for the SAMLtest SP, named by entityID -->

<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" ID="SAMLtestSP" validUntil="2100-01-01T00:00:42Z" entityID="https://samltest.id/saml/sp">

<!-- This list enumerates the cryptographic algorithms acceptable to this SP -->
  <md:Extensions xmlns:alg="urn:oasis:names:tc:SAML:metadata:algsupport">
    <alg:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha512"/>
    <alg:DigestMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#sha384"/>
    <alg:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
    <alg:DigestMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#sha224"/>
    <alg:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
    <alg:SigningMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha512"/>
    <alg:SigningMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha384"/>
    <alg:SigningMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256"/>
    <alg:SigningMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha224"/>
    <alg:SigningMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha512"/>
    <alg:SigningMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha384"/>
    <alg:SigningMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
    <alg:SigningMethod Algorithm="http://www.w3.org/2009/xmldsig11#dsa-sha256"/>
    <alg:SigningMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha1"/>
    <alg:SigningMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
    <alg:SigningMethod Algorithm="http://www.w3.org/2000/09/xmldsig#dsa-sha1"/>
  </md:Extensions>

  <md:SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:Extensions>

<!-- The location to redirect users to for invocation of an AuthnRequest -->
      <init:RequestInitiator xmlns:init="urn:oasis:names:tc:SAML:profiles:SSO:request-init" Binding="urn:oasis:names:tc:SAML:profiles:SSO:request-init" Location="https://samltest.id/Shibboleth.sso/Login"/>

<!-- Display information about this SP that the IdP can present to users -->
      <mdui:UIInfo xmlns:mdui="urn:oasis:names:tc:SAML:metadata:ui">
          <mdui:DisplayName xml:lang="en">SAMLtest SP</mdui:DisplayName>
          <mdui:Description xml:lang="en">A free and basic SP for testing SAML deployments</mdui:Description>
          <mdui:Logo height="90" width="225">https://samltest.id/saml/logo.png</mdui:Logo>
       </mdui:UIInfo>

    </md:Extensions>
<!-- A certificate containing the public key for verification of signed messages from this SP.
This is rarely used because the SP sends few signed messages, but using a separate key is better
security hygiene.  In practice, many SP's use only one key for both encryption and signature.
Most SAML implementations don't rely on the rest of the certificate's contents. -->
    <md:KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>
MIIERTCCAq2gAwIBAgIJAKmtzjCD1+tqMA0GCSqGSIb3DQEBCwUAMDUxMzAxBgNV
BAMTKmlwLTE3Mi0zMS0yOC02NC51cy13ZXN0LTIuY29tcHV0ZS5pbnRlcm5hbDAe
Fw0xODA4MTgyMzI0MjNaFw0yODA4MTUyMzI0MjNaMDUxMzAxBgNVBAMTKmlwLTE3
Mi0zMS0yOC02NC51cy13ZXN0LTIuY29tcHV0ZS5pbnRlcm5hbDCCAaIwDQYJKoZI
hvcNAQEBBQADggGPADCCAYoCggGBALhUlY3SkIOze+l8y6dBzM6p7B8OykJWlwiz
szU16Lih8D7KLhNJfahoVxbPxB3YFM/81PJLOeK2krvJ5zY6CJyQY3sPQAkZKI7I
8qq9lmZ2g4QPqybNstXS6YUXJNUt/ixbbK/N97+LKTiSutbD1J7AoFnouMuLjlhN
5VRZ43jez4xLSHVZaYuUFKn01Y9oLKbj46LQnZnJCAGpTgPqEQJr6GpVGw43bKyU
pGoaPrdDRgRgtPMUWgFDkgcI3QiV1lsKfBs1t1E2UA7ACFnlJZpEuBtwgivzo3Ve
itiSaF3Jxh25EY5/vABpcgQQRz3RH2l8MMKdRsxb8VT3yh2S+CX55s+cN67LiCPr
6f2u+KS1iKfB9mWN6o2S4lcmo82HIBbsuXJV0oA1HrGMyyc4Y9nng/I8iuAp8or1
JrWRHQ+8NzO85DWK0rtvtLPxkvw0HK32glyuOP/9F05Z7+tiVIgn67buC0EdoUm1
RSpibqmB1ST2PikslOlVbJuy4Ah93wIDAQABo1gwVjA1BgNVHREELjAsgippcC0x
NzItMzEtMjgtNjQudXMtd2VzdC0yLmNvbXB1dGUuaW50ZXJuYWwwHQYDVR0OBBYE
FAdsTxYfulJ5yunYtgYJHC9IcevzMA0GCSqGSIb3DQEBCwUAA4IBgQB3J6i7Krei
HL8NPMglfWLHk1PZOgvIEEpKL+GRebvcbyqgcuc3VVPylq70VvGqhJxp1q/mzLfr
aUiypzfWFGm9zfwIg0H5TqRZYEPTvgIhIICjaDWRwZBDJG8D5G/KoV60DlUG0crP
BlIuCCr/SRa5ZoDQqvucTfr3Rx4Ha6koXFSjoSXllR+jn4GnInhm/WH137a+v35P
UcffNxfuehoGn6i4YeXF3cwJK4e35cOFW+dLbnaLk+Ty7HOGvpw86h979C6mJ9qE
HYgq9rQyzlSPbLZGZSgVcIezunOaOsWm81BsXRNNJjzHGCqKf8RMhd8oZP55+2/S
VRBwnkGyUNCuDPrJcymC95ZT2NW/KeWkz28HF2i31xQmecT2r3lQRSM8acvOXQsN
EDCDvJvCzJT9c2AnsnO24r6arPXs/UWAxOI+MjclXPLkLD6uTHV+Oo8XZ7bOjegD
5hL6/bKUWnNMurQNGrmi/jvqsCFLDKftl7ajuxKjtodnSuwhoY7NQy8=
</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </md:KeyDescriptor>
<!-- A certificate containing the public key for encryption of messages sent to the SAMLtest SP.
This key is crucial for securing assertions from IdP's.  Multiple encryption keys can be listed
and this will often be necessary for key rollovers. -->
    <md:KeyDescriptor use="encryption">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>
MIIERTCCAq2gAwIBAgIJAKGA/tV7hXUvMA0GCSqGSIb3DQEBCwUAMDUxMzAxBgNV
BAMTKmlwLTE3Mi0zMS0yOC02NC51cy13ZXN0LTIuY29tcHV0ZS5pbnRlcm5hbDAe
Fw0xODA4MTgyMzI0MjVaFw0yODA4MTUyMzI0MjVaMDUxMzAxBgNVBAMTKmlwLTE3
Mi0zMS0yOC02NC51cy13ZXN0LTIuY29tcHV0ZS5pbnRlcm5hbDCCAaIwDQYJKoZI
hvcNAQEBBQADggGPADCCAYoCggGBANoi7TtbPz5DD5b+pGj2bWHUWcOm135Dl+kf
KWcJV6x4Z4VRMa33nwSfFg6U0DhPaA6rYr8BfcmCIY4V4cGlJkLNsYbgbZNnrLh2
3mj7jkaUeyv/DlGtLBcqr0gP6eDtcOf3MMGAkhROcicMj6i+uF6hqLDh4eNcpqEV
DVn+ADBsosIPiAx+RkcyZkfAF3UeGEV5WTSiQw7qYpI7x+c4ViiBzV4waBgXjvNN
72Dqlc01AylpmMKaUPfxIpPC+Ctr0bHu5xn7NxMS8Zt5NDWsP9T15qrpYatW68sX
VyE5nJRYpiRiRbo8i7QpUEya+TkXEI8PVD3KBw9UwhqL8qPPe0T+EeaawF6BVRTE
Pc+Mn4lGBr4cCFcGk/PLHeyksgPdjNmO1g7y5TWQzu21WzkXRTWJq7wGwWeW6Nrc
NqweYPLbXEo0JlmHqunkUs+NsLQAFqSPX02P2xzkA/eOU2o/jN4jAPNpzqxJouvm
iWGXl8Qy4U7vQZ0tGvlTDSltATOQ/QIDAQABo1gwVjA1BgNVHREELjAsgippcC0x
NzItMzEtMjgtNjQudXMtd2VzdC0yLmNvbXB1dGUuaW50ZXJuYWwwHQYDVR0OBBYE
FBBtS9YNKSIwViH37GJCTxjNBzLAMA0GCSqGSIb3DQEBCwUAA4IBgQDWXcaI7zMn
hGsLVTUA6dgzZCa88QkN/Z6n7lCY2oaKj1neBAWA1Mxg7GBJsmLOrHN8ie0D/uKA
F+7NqKCXYqd0PpTX7c1NICL92DvbugG/Ow50j5Dw6rU4Y8dPS7Y/T1ddbT2F9/5l
HCIWP/O2E9HREJ0JAIbu/Mi0CE1qui2aSJMDWKuiGK63M/7fvP51m6xSJOfZBhmj
gllIwEhIzfh4hVPhH0C7iqVls34UyLCZ8IZOCuGPJyTaJN6Pi3Uo1Otkz/1igN5M
pQhVaeYG7SMgha6skTLrVXTt4CuMVsOZ6cG3kHqw8XZoRld+I50iyHqansf5qwzm
NoPeXyjGRFQzV/EH3SUu8eAISTt9pfirwjKsVNHrmMRnQEB/hJYYbTWSsvdS8ghw
7a/A0EKQPVaZGCP/hcpt9JMMb66y2L8VgBbb6aTsR+Uabf6aiMnj1UBMUz9yaMka
kKM7e66uHdXUDZ/s8F5rPOGCK+O8O6EsLRf8XetRWLa1TXRDkJZVPX4=
</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
      <md:EncryptionMethod Algorithm="http://www.w3.org/2009/xmlenc11#aes128-gcm"/>
      <md:EncryptionMethod Algorithm="http://www.w3.org/2009/xmlenc11#aes192-gcm"/>
      <md:EncryptionMethod Algorithm="http://www.w3.org/2009/xmlenc11#aes256-gcm"/>
      <md:EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes128-cbc"/>
      <md:EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes192-cbc"/>
      <md:EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes256-cbc"/>
      <md:EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#tripledes-cbc"/>
      <md:EncryptionMethod Algorithm="http://www.w3.org/2009/xmlenc11#rsa-oaep"/>
      <md:EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#rsa-oaep-mgf1p"/>
    </md:KeyDescriptor>

<!-- These endpoints tell IdP's where to send messages, either directly or via
a browser redirect.  The locations must match the address of the SP as seen from the outside
world if this host is behind a reverse proxy. -->
    <md:ArtifactResolutionService Binding="urn:oasis:names:tc:SAML:2.0:bindings:SOAP" Location="https://samltest.id/Shibboleth.sso/Artifact/SOAP" index="1"/>
    <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:SOAP" Location="https://samltest.id/Shibboleth.sso/SLO/SOAP"/>
    <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://samltest.id/Shibboleth.sso/SLO/Redirect"/>
    <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://samltest.id/Shibboleth.sso/SLO/POST"/>
    <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Artifact" Location="https://samltest.id/Shibboleth.sso/SLO/Artifact"/>
<!-- The primary endpoint to which SAML assertions will be delivered. -->
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://samltest.id/Shibboleth.sso/SAML2/POST" index="1"/>
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST-SimpleSign" Location="https://samltest.id/Shibboleth.sso/SAML2/POST-SimpleSign" index="2"/>
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Artifact" Location="https://samltest.id/Shibboleth.sso/SAML2/Artifact" index="3"/>
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:PAOS" Location="https://samltest.id/Shibboleth.sso/SAML2/ECP" index="4"/>
  </md:SPSSODescriptor>

</md:EntityDescriptor>
  `,
    });

    const amazonGrafana = new ServiceProviderInstance({
        entityID:                 'https://g-954f6e87ce.grafana-workspace.us-west-2.amazonaws.com/saml/metadata',
        assertionConsumerService: [{
            Binding:  Constants.BindingNamespace.Post,
            Location: 'https://g-954f6e87ce.grafana-workspace.us-west-2.amazonaws.com/saml/acs',
        }],
    });

    app.get('/metadata.xml', (_, res) => {
        res.send(idp.getMetadata());
    });

    // eslint-disable-next-line @typescript-eslint/no-misused-promises, max-lines-per-function
    app.get('/sso', async (req, res): Promise<void> => {
        try {
            const relayState = req.query[Constants.wording.urlParams.relayState] as string;
            const loginInfo = await idp.parseLoginRequest(amazonGrafana, Constants.wording.binding.redirect, req);
            const {request:{id, assertionConsumerServiceUrl}, issuer} = loginInfo.extract as {
                request: {
                    id: string;
                    assertionConsumerServiceUrl: string;
                };
                issuer: string;
            };
            const nowDate = new Date();
            const fiveMinutesLaterTime = new Date(nowDate.getTime());
            fiveMinutesLaterTime.setMinutes(fiveMinutesLaterTime.getMinutes() + 5);
            const fiveMinutesLater = fiveMinutesLaterTime.toISOString();
            const now = nowDate.toISOString();
            console.log({loginInfo});
            const resp = await idp.createLoginResponse(
                amazonGrafana,
                loginInfo,
                Constants.wording.binding.post,
                {
                    email: 'yoyoyo@example.com',
                },
                (template: string) => ({
                    context: SamlLib.replaceTagsByValue(template, {
                        ID:                          id,
                        AssertionID:                 randomUUID(),
                        Destination:                 assertionConsumerServiceUrl,
                        Audience:                    issuer,
                        EntityID:                    amazonGrafana.entityMeta.getEntityID(),
                        SubjectRecipient:            amazonGrafana.entityMeta.getAssertionConsumerService(Constants.wording.binding.post),
                        Issuer:                      idp.entityMeta.getEntityID(),
                        IssueInstant:                now,
                        AssertionConsumerServiceURL: amazonGrafana.entityMeta.getAssertionConsumerService(Constants.wording.binding.post),
                        StatusCode:                  Constants.StatusCode.Success,

                        // Can be customized
                        ConditionsNotBefore:                 now,
                        ConditionsNotOnOrAfter:              fiveMinutesLater,
                        SubjectConfirmationDataNotOnOrAfter: fiveMinutesLater,
                        NameIDFormat:                        idp.entitySetting.nameIDFormat![0],
                        NameID:                              'yoyoyo@example.com@hello-world',
                        InResponseTo:                        id,
                        AuthnStatement:                      '',
                        AttributeStatement:                  '',

                        // NameIDFormat: Constants.namespace.format.emailAddress,

                        attrUserRole:  'user',
                        attrUserName:  'YO',
                        attrUserEmail: 'yoyoyo@example.com',
                        attrUserOrg:   'example.com',
                        attrUserTtl:   '480',
                    }),
                    id,
                }),
                false,
                relayState,
            ) as {
                context: string;
            };
            console.log({resp});

            res.setHeader('Content-Security-Policy', `script-src 'unsafe-inline'; form-action ${assertionConsumerServiceUrl};`).send(`<!DOCTYPE html>
<html>
    <body>
        <h1>Redirecting you back to where you come from . . .</h1>
        <form id="sso" method="post" action="${assertionConsumerServiceUrl}" autocomplete="off">
            <input type="hidden" name="SAMLResponse" id="resp" value="${resp.context}" />
            <input type="hidden" name="RelayState" id="resp" value="${relayState}" />
        </form>
        <script>
            window.onload = function () {
                document.forms[0].submit();
            };
        </script>
    </body>
</html>
`);
        } catch (error) {
            console.log(error);
        }
    });

    /*
     * App.get('/login', samlp.auth({
     *     issuer:     'll-dev',
     *     cert:       readFileSync(join(__dirname, '..', 'cert.pem')).toString(),
     *     key:        readFileSync(join(__dirname, '..', 'key.pem')).toString(),
     *     getPostURL: (audience: string, authnRequestDom: any, req, callback) => {
     *         console.log({audience});
     *         console.log({authnRequestDom});
     *         console.log({req});
     *         callback(null, 'http://someurl.com');
     *     },
     * }));
     */

    /*
     * App.post('/login', samlp.auth({
     *     issuer:     'll-dev',
     *     cert:       readFileSync(join(__dirname, '..', 'cert.pem')).toString(),
     *     key:        readFileSync(join(__dirname, '..', 'key.pem')).toString(),
     *     getPostURL: (audience: string, authnRequestDom: any, req, callback) => {
     *         console.log({audience});
     *         console.log({authnRequestDom});
     *         console.log({req});
     *         callback(null, 'http://someurl.com');
     *     },
     * }));
     */

    /*
     * App.get('/metadata.xml', samlp.metadata({
     *     issuer:               'll-dev',
     *     cert:                 readFileSync(join(__dirname, '..', 'cert.pem')).toString(),
     *     redirectEndpointPath: '/login',
     *     postEndpointPath:     '/login',
     *     logoutEndpointPaths:  {
     *         redirect: '/logout',
     *         post:     '/logout',
     *     },
     * }));
     */

    /*
     * App.get('/logout', samlp.logout({
     *     deflate:         true,
     *     issuer:          'll-dev',
     *     protocolBinding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
     *     cert:            readFileSync(join(__dirname, '..', 'cert.pem')).toString(),
     *     key:             readFileSync(join(__dirname, '..', 'key.pem')).toString(),
     * } as unknown as AuthOptions));
     */

    /*
     * App.post('/logout', samlp.logout({
     *     issuer:          'll-dev',
     *     protocolBinding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
     *     cert:            readFileSync(join(__dirname, '..', 'cert.pem')).toString(),
     *     key:             readFileSync(join(__dirname, '..', 'key.pem')).toString(),
     * } as unknown as AuthOptions));
     */

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
