import {env} from 'process';
import {validate} from '@authenio/samlify-node-xmllint';
import dotenv from 'dotenv';
import {Constants, SamlLib, ServiceProviderInstance, setSchemaValidator} from 'samlify';
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

export const HOST = (env.HOST ?? '') || '127.0.0.1';
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
export const PORT = parseInt(env.PORT ?? '', 10) || 8080;

// Assertion life time in milliseconds.
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
export const SAML_IDENTITY_PROVIDER_ASSERTION_LIFE_TIME = 5 * 60 * 1000;

const SAML_IDENTITY_PROVIDER_BASE_URL = (env.SAML_IDENTITY_PROVIDER_HOSTNAME ?? '') || 'https://idp.example.com';
const SAML_IDENTITY_PROVIDER_CERTIFICATE = (env.SAML_IDENTITY_PROVIDER_CERTIFICATE ?? '') || `-----BEGIN CERTIFICATE-----
MIIFvzCCA6egAwIBAgIUNRzuqIfOtECJT04MkNm98CPA5E0wDQYJKoZIhvcNAQEL
BQAwbzELMAkGA1UEBhMCTVcxFTATBgNVBAgMDFNvbGFyIFN5c3RlbTEOMAwGA1UE
BwwFRWFydGgxDTALBgNVBAoMBEhvbW8xEDAOBgNVBAsMB1NhcGllbnMxGDAWBgNV
BAMMD2lkcC5leGFtcGxlLmNvbTAeFw0yMjA1MDcwOTEzMjhaFw0yMjA2MDYwOTEz
MjhaMG8xCzAJBgNVBAYTAk1XMRUwEwYDVQQIDAxTb2xhciBTeXN0ZW0xDjAMBgNV
BAcMBUVhcnRoMQ0wCwYDVQQKDARIb21vMRAwDgYDVQQLDAdTYXBpZW5zMRgwFgYD
VQQDDA9pZHAuZXhhbXBsZS5jb20wggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIK
AoICAQCnYPX8P0XTrgcvMGs5HUUtOO8bGGJv+z7qIAwcADDWr9qQrJxyWtEDHbOG
BDNRprdTgKPDkvslSbk0T+PNftQKdvmTnN/DX43ybhZjee9oqQajJt6IpSUppc+2
Gss7/Sk4kxRYAdQKKwOEyOOhnul/hn/i5/ReBIaj/xofjE+w3RzKSuTQLtiba8gO
Ikq9cKzWy+V6X2skPrOoTlBHmxhJul9QOG+CvCCDF49CDmAMuz0u8NLtkTlOQ27i
0Aby9EAzCZ6rijJwL0uDEl9hOdIh0hOKwmE/m0wzR+9Ikde/tFknNBZAKeiqb1+9
QSypnA7/ENSjqzvAMbR2N7fNbviSR9h51sTeYu27gleeJR6iQE9KyRTmVWjHsGDy
/yp7dCX/0ao9nMt5feuatoU4Ep1DA5OpCTi1auG0eTDT0qPwhj3bRdIag4UzvjkJ
Q4x/oFnMtpzBXW/Ym+y71KED9uAAbr+HYqmuWfaCUCWfBOLZ8dkUrm6WSo8Mu4Jx
pkszVQ+taN6MIzOJDWH/e1vFfk3rT2oEl6n8MfcUVuFDjM4GJERlimK/ON0MPVyF
1IpFZI6OQ9x6H5+5HdCGKZoN0bdVDteLDzaFBmdVhUhiD+Bb/lCZmdBvKFAkHux8
qx67laxvvpqEagJPoFI8xVLcx4UAq8it6reTqjYkcBIrVz32kQIDAQABo1MwUTAd
BgNVHQ4EFgQUfIXcEJ8P3aD2qlCzAOXkO7Wyr1owHwYDVR0jBBgwFoAUfIXcEJ8P
3aD2qlCzAOXkO7Wyr1owDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOC
AgEABAYv4mJbOC0nBN9AONO0J43CRN61WdcSb93MhPZdFEyUN8MKN6C+bci7MYDy
3O5g+/cZWhjdeY1Ze/BUszpq4LLxDZRfcr5Va9eKJcXc1OetOB/Wd7yyHUigsRt4
u9KSBIcufdGLofQrhIo4nak92diYbzh9YyTIxuVDmbb/TtpccsRsKOYuUOtYE1Yr
BjM3VhBN2E1zyvS171JbcqkFLQZ0zVI5lm/UuC6JTnJ1LPMwBBABe/wY6T0cQkuq
yknPBGeGqALbisMbbe6s1FG+Ua5rPzGDdGGLSFqdjJRDJehPan3adBTrOk+r8r/R
6leeuPRxR+JCzGccDDF6OHB4gi1qCCO6jwdgK/6QbaFsLbEE7GKICst+3Nbf7GET
OtkbL3WXFpPLSKL/1Y/8UyXqWtQ7Y8gbfvFWkdE75egsOYS3ydNAgGrbBs3KU8t/
CODIvpyzkzMZFcywOimgSLm37G7arsnEr7CLayJZ/TjtYX62g1XAvxPpQE7pkY5g
gKBcw8SgrkdIPnsK7r9jWUWCzBCorcPu5ix+Hb6VQvP/nAEF5PqIvGRFWLAMdiQJ
1dAZSob80s4jiV/0gqeIhtq4nyGPIYErwTIcHF85U/lQohe+Qyz5hRFQkTnE6QNZ
Bd+0eSm9tu7lf4ueYQrVirqd97ZVchVYAz7/+BTzcwkhZPY=
-----END CERTIFICATE-----`;
const SAML_IDENTITY_PROVIDER_PRIVATE_KEY = (env.SAML_IDENTITY_PROVIDER_PRIVATE_KEY ?? '') || `-----BEGIN PRIVATE KEY-----
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
lMvZi7Ui1ueu9de/T2ZUGSKbK4TGYQ==
-----END PRIVATE KEY-----`;

setSchemaValidator({validate});

export const SAML_IDENTITY_PROVIDER_SETTINGS: IdentityProviderSettings = {
    /* eslint-disable @typescript-eslint/naming-convention */
    entityID: `${SAML_IDENTITY_PROVIDER_BASE_URL}/saml/metadata`,

    requestSignatureAlgorithm: Constants.algorithms.signature.RSA_SHA512,
    signingCert:               SAML_IDENTITY_PROVIDER_CERTIFICATE,
    privateKey:                SAML_IDENTITY_PROVIDER_PRIVATE_KEY,

    singleSignOnService: [{
        Binding:  Constants.BindingNamespace.Redirect,
        Location: `${SAML_IDENTITY_PROVIDER_BASE_URL}/saml/sso`,
    }, {
        Binding:  Constants.BindingNamespace.Post,
        Location: `${SAML_IDENTITY_PROVIDER_BASE_URL}/saml/sso`,
    }],

    nameIDFormat: [Constants.namespace.format.transient],

    loginResponseTemplate: {
        ...SamlLib.defaultLoginResponseTemplate,
        attributes: [{
            name:         'email',
            valueTag:     'user.email',
            nameFormat:   'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
            valueXsiType: 'xs:string',
        }, {
            name:         'name',
            valueTag:     'user.name',
            nameFormat:   'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
            valueXsiType: 'xs:string',
        }, {
            name:         'org',
            valueTag:     'user.org',
            nameFormat:   'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
            valueXsiType: 'xs:string',
        }, {
            name:         'role',
            valueTag:     'user.role',
            nameFormat:   'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
            valueXsiType: 'xs:string',
        }, {
            name:         'group',
            valueTag:     'user.group',
            nameFormat:   'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
            valueXsiType: 'xs:string',
        }],
    },
    /* eslint-enable @typescript-eslint/naming-convention */
};

export const SAML_SERVICE_PROVIDERS: Record<string, ServiceProviderInstance> = {
    samlTest: new ServiceProviderInstance({
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
    }),
    amazonGrafana: new ServiceProviderInstance({
    /* eslint-disable @typescript-eslint/naming-convention */
        entityID:                 'https://g-954f6e87ce.grafana-workspace.us-west-2.amazonaws.com/saml/metadata',
        assertionConsumerService: [{
            Binding:  Constants.BindingNamespace.Post,
            Location: 'https://g-954f6e87ce.grafana-workspace.us-west-2.amazonaws.com/saml/acs',
        }],
    /* eslint-enable @typescript-eslint/naming-convention */
    }),
};
