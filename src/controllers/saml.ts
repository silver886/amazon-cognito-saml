/* eslint-disable new-cap */
import {ErrorContext} from '@silver886/error-context';
import {Controller, Example, Get, Post, Query, Request, Response, Route, Tags} from '@tsoa/runtime';
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
    private static precheck(caller: string, request: CompositeRequest, spId: string): {
        response: ExpressResponse;
        serviceProviderId: string;
    } {
        const response = request.res;
        if (!response) {
            throw new ErrorContext(new Error('Response is undefined'), {
                requestId:      request.id,
                source:         `[${caller}] (${__filename})`,
                httpStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                request,
            });
        }

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
        if (!SAML_SERVICE_PROVIDERS[spId]) {
            throw new ErrorContext(new Error('Service provider ID is not recognized'), {
                requestId:      request.id,
                source:         `[${caller}] (${__filename})`,
                httpStatusCode: StatusCodes.BAD_REQUEST,
                request,
            });
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
    @Response<BasicResponse & {message: string}>(StatusCodes.INTERNAL_SERVER_ERROR, 'Internal server error', {
        requestId: '15ea85ec-2433-4d49-99a0-ca91523fbdce',
        message:   'Internal Server Error',
    })
    @Get('/metadata')
    public getMetadata(
        @Request() request: CompositeRequest,
            @Query() spId: string,
    ): SamlController {
        const {response, serviceProviderId} = SamlController.precheck('metadata', request, spId);

        return metadata(this, {
            request,
            response,
        }, {
            serviceProviderId,
        });
    }

    /**
     * Perform single sign on.
     */
    /* spell-checker: disable */
    @Example<string>(`<!DOCTYPE html>
        <html>
            <body>
                <h1>Redirecting to where you come from . . .</h1>
                <form id="sso" method="post" action="https://sp.example.com/saml/acs" autocomplete="off">
                    <input type="hidden" name="SAMLResponse" id="resp" value="PHNhbWxwOlJlc3BvbnNlIHhtbG5zOnNhbWxwPSJ1cm46b2FzaXM6bmFtZXM6dGM6U0FNTDoyLjA6cHJvdG9jb2wiIHhtbG5zOnNhbWw9InVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDphc3NlcnRpb24iIElEPSI0MmY2NDVkNC1kMzJiLTRjZmItOWQxZS0wZmIzMDgwZmZiNWEiIFZlcnNpb249IjIuMCIgSXNzdWVJbnN0YW50PSIyMDIyLTA1LTA3VDA3OjUwOjAzLjI4MloiIERlc3RpbmF0aW9uPSJodHRwOi8vc3AuZXhhbXBsZS5jb20vc2FtbC9hY3MiIEluUmVzcG9uc2VUbz0iNDJmNjQ1ZDQtZDMyYi00Y2ZiLTlkMWUtMGZiMzA4MGZmYjVhIj48c2FtbDpJc3N1ZXI+aHR0cHM6Ly9pZHAuZXhhbXBsZS5jb20vc2FtbC9tZXRhZGF0YTwvc2FtbDpJc3N1ZXI+PGRzOlNpZ25hdHVyZSB4bWxuczpkcz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC8wOS94bWxkc2lnIyI+PC9kczpTaWduYXR1cmU+PHNhbWxwOlN0YXR1cz48c2FtbHA6U3RhdHVzQ29kZSBWYWx1ZT0idXJuOm9hc2lzOm5hbWVzOnRjOlNBTUw6Mi4wOnN0YXR1czpTdWNjZXNzIiAvPjwvc2FtbHA6U3RhdHVzPjxzYW1sOkFzc2VydGlvbiB4bWxuczp4c2k9Imh0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hLWluc3RhbmNlIiB4bWxuczp4cz0iaHR0cDovL3d3dy53My5vcmcvMjAwMS9YTUxTY2hlbWEiIHhtbG5zOnNhbWw9InVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDphc3NlcnRpb24iIElEPSJmMTA4NGFiNi1mZDliLTQ4YzQtYWFmZi0xNjAyM2RjOTVjYzQiIFZlcnNpb249IjIuMCIgSXNzdWVJbnN0YW50PSIyMDIyLTA1LTA3VDA3OjUwOjAzLjI4MloiPjxzYW1sOklzc3Vlcj5odHRwczovL2lkcC5leGFtcGxlLmNvbS9zYW1sL21ldGFkYXRhPC9zYW1sOklzc3Vlcj48c2FtbDpTdWJqZWN0PjxzYW1sOk5hbWVJRCBGb3JtYXQ9InVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDpuYW1laWQtZm9ybWF0OnRyYW5zaWVudCI+ZGMxZDFjZDEtMGQ1Yi00YTM3LTgxYzAtNDVlMzdkNzE0YmVkPC9zYW1sOk5hbWVJRD48c2FtbDpTdWJqZWN0Q29uZmlybWF0aW9uIE1ldGhvZD0idXJuOm9hc2lzOm5hbWVzOnRjOlNBTUw6Mi4wOmNtOmJlYXJlciI+PHNhbWw6U3ViamVjdENvbmZpcm1hdGlvbkRhdGEgTm90T25PckFmdGVyPSIyMDIyLTA1LTA3VDA3OjU1OjAzLjI4MloiIFJlY2lwaWVudD0iaHR0cDovL3NwLmV4YW1wbGUuY29tL3NhbWwvYWNzIiBJblJlc3BvbnNlVG89IjQyZjY0NWQ0LWQzMmItNGNmYi05ZDFlLTBmYjMwODBmZmI1YSIgLz48L3NhbWw6U3ViamVjdENvbmZpcm1hdGlvbj48L3NhbWw6U3ViamVjdD48c2FtbDpDb25kaXRpb25zIE5vdEJlZm9yZT0iMjAyMi0wNS0wN1QwNzo1MDowMy4yODJaIiBOb3RPbk9yQWZ0ZXI9IjIwMjItMDUtMDdUMDc6NTU6MDMuMjgyWiI+PHNhbWw6QXVkaWVuY2VSZXN0cmljdGlvbj48c2FtbDpBdWRpZW5jZT5odHRwczovL3NwLmV4YW1wbGUuY29tL3NhbWwvbWV0YWRhdGE8L3NhbWw6QXVkaWVuY2U+PC9zYW1sOkF1ZGllbmNlUmVzdHJpY3Rpb24+PC9zYW1sOkNvbmRpdGlvbnM+PHNhbWw6QXR0cmlidXRlU3RhdGVtZW50Pjwvc2FtbDpBdHRyaWJ1dGVTdGF0ZW1lbnQ+PC9zYW1sOkFzc2VydGlvbj48L3NhbWxwOlJlc3BvbnNlPg==" />
                    <input type="hidden" name="RelayState" id="resp" value="14330ac3-0ff2-41fd-a38b-cbd36eee599c" />
                </form>
                <script>
                    window.onload = function () {
                        document.forms[0].submit();
                    };
                </script>
            </body>
        </html>`)
    /* spell-checker: enable */
    @Response<BasicResponse & {message: string}>(StatusCodes.INTERNAL_SERVER_ERROR, 'Internal server error', {
        requestId: '77d49934-fa07-4f84-a80a-b8faf289d7f9',
        message:   'Internal Server Error',
    })
    @Get('/sso')
    public async getSso(
        @Request() request: CompositeRequest,
            @Query() spId: string,
    ): Promise<SamlController> {
        const {response, serviceProviderId} = SamlController.precheck('getSso', request, spId);
        const relayState = request.query[Constants.wording.urlParams.relayState];
        return sso(this, {
            request,
            response,
        }, {
            binding:    Constants.wording.binding.redirect,
            serviceProviderId,
            relayState: typeof relayState === 'string' ? relayState : '',
        });
    }

    /**
     * Perform single sign on.
     */
    /* spell-checker: disable */
    @Example<string>(`<!DOCTYPE html>
        <html>
            <body>
                <h1>Redirecting to where you come from . . .</h1>
                <form id="sso" method="post" action="https://sp.example.com/saml/acs" autocomplete="off">
                    <input type="hidden" name="SAMLResponse" id="resp" value="PHNhbWxwOlJlc3BvbnNlIHhtbG5zOnNhbWxwPSJ1cm46b2FzaXM6bmFtZXM6dGM6U0FNTDoyLjA6cHJvdG9jb2wiIHhtbG5zOnNhbWw9InVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDphc3NlcnRpb24iIElEPSI0MmY2NDVkNC1kMzJiLTRjZmItOWQxZS0wZmIzMDgwZmZiNWEiIFZlcnNpb249IjIuMCIgSXNzdWVJbnN0YW50PSIyMDIyLTA1LTA3VDA3OjUwOjAzLjI4MloiIERlc3RpbmF0aW9uPSJodHRwOi8vc3AuZXhhbXBsZS5jb20vc2FtbC9hY3MiIEluUmVzcG9uc2VUbz0iNDJmNjQ1ZDQtZDMyYi00Y2ZiLTlkMWUtMGZiMzA4MGZmYjVhIj48c2FtbDpJc3N1ZXI+aHR0cHM6Ly9pZHAuZXhhbXBsZS5jb20vc2FtbC9tZXRhZGF0YTwvc2FtbDpJc3N1ZXI+PGRzOlNpZ25hdHVyZSB4bWxuczpkcz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC8wOS94bWxkc2lnIyI+PC9kczpTaWduYXR1cmU+PHNhbWxwOlN0YXR1cz48c2FtbHA6U3RhdHVzQ29kZSBWYWx1ZT0idXJuOm9hc2lzOm5hbWVzOnRjOlNBTUw6Mi4wOnN0YXR1czpTdWNjZXNzIiAvPjwvc2FtbHA6U3RhdHVzPjxzYW1sOkFzc2VydGlvbiB4bWxuczp4c2k9Imh0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hLWluc3RhbmNlIiB4bWxuczp4cz0iaHR0cDovL3d3dy53My5vcmcvMjAwMS9YTUxTY2hlbWEiIHhtbG5zOnNhbWw9InVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDphc3NlcnRpb24iIElEPSJmMTA4NGFiNi1mZDliLTQ4YzQtYWFmZi0xNjAyM2RjOTVjYzQiIFZlcnNpb249IjIuMCIgSXNzdWVJbnN0YW50PSIyMDIyLTA1LTA3VDA3OjUwOjAzLjI4MloiPjxzYW1sOklzc3Vlcj5odHRwczovL2lkcC5leGFtcGxlLmNvbS9zYW1sL21ldGFkYXRhPC9zYW1sOklzc3Vlcj48c2FtbDpTdWJqZWN0PjxzYW1sOk5hbWVJRCBGb3JtYXQ9InVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDpuYW1laWQtZm9ybWF0OnRyYW5zaWVudCI+ZGMxZDFjZDEtMGQ1Yi00YTM3LTgxYzAtNDVlMzdkNzE0YmVkPC9zYW1sOk5hbWVJRD48c2FtbDpTdWJqZWN0Q29uZmlybWF0aW9uIE1ldGhvZD0idXJuOm9hc2lzOm5hbWVzOnRjOlNBTUw6Mi4wOmNtOmJlYXJlciI+PHNhbWw6U3ViamVjdENvbmZpcm1hdGlvbkRhdGEgTm90T25PckFmdGVyPSIyMDIyLTA1LTA3VDA3OjU1OjAzLjI4MloiIFJlY2lwaWVudD0iaHR0cDovL3NwLmV4YW1wbGUuY29tL3NhbWwvYWNzIiBJblJlc3BvbnNlVG89IjQyZjY0NWQ0LWQzMmItNGNmYi05ZDFlLTBmYjMwODBmZmI1YSIgLz48L3NhbWw6U3ViamVjdENvbmZpcm1hdGlvbj48L3NhbWw6U3ViamVjdD48c2FtbDpDb25kaXRpb25zIE5vdEJlZm9yZT0iMjAyMi0wNS0wN1QwNzo1MDowMy4yODJaIiBOb3RPbk9yQWZ0ZXI9IjIwMjItMDUtMDdUMDc6NTU6MDMuMjgyWiI+PHNhbWw6QXVkaWVuY2VSZXN0cmljdGlvbj48c2FtbDpBdWRpZW5jZT5odHRwczovL3NwLmV4YW1wbGUuY29tL3NhbWwvbWV0YWRhdGE8L3NhbWw6QXVkaWVuY2U+PC9zYW1sOkF1ZGllbmNlUmVzdHJpY3Rpb24+PC9zYW1sOkNvbmRpdGlvbnM+PHNhbWw6QXR0cmlidXRlU3RhdGVtZW50Pjwvc2FtbDpBdHRyaWJ1dGVTdGF0ZW1lbnQ+PC9zYW1sOkFzc2VydGlvbj48L3NhbWxwOlJlc3BvbnNlPg==" />
                    <input type="hidden" name="RelayState" id="resp" value="13d6debf-d650-49e6-93cd-9d3887389892" />
                </form>
                <script>
                    window.onload = function () {
                        document.forms[0].submit();
                    };
                </script>
            </body>
        </html>`)
    /* spell-checker: enable */
    @Response<BasicResponse & {message: string}>(StatusCodes.INTERNAL_SERVER_ERROR, 'Internal server error', {
        requestId: '9d9e5b39-8d11-49c0-9a40-de7395949532',
        message:   'Internal Server Error',
    })
    @Post('/sso')
    public async postSso(
        @Request() request: CompositeRequest,
            @Query() spId: string,
    ): Promise<SamlController> {
        const {response, serviceProviderId} = SamlController.precheck('postSso', request, spId);
        const relayState = request.query[Constants.wording.urlParams.relayState];
        return sso(this, {
            request,
            response,
        }, {
            binding:    Constants.wording.binding.redirect,
            serviceProviderId,
            relayState: typeof relayState === 'string' ? relayState : '',
        });
    }
}
