# Amazon Cognito SAML IdP

Convert Amazon Cognito OpenID Connect client to SAML identity provider.

## Concept

This application contains an OpenID Connect client with a SAML identity provider.

Once the SAML identity provider receives a auth request, the application will encrypt and save the `state` and `nonce` to cookies.
Then, the OpenID Connect client will send an auth request to the Amazon Cognito set in the `.env`.

Once the OpenID Connect client receives a callback request, it will resolve the auth code and token to fetch user info.
After resolving without saving and data, the SAML identity provider will generate and sign the assertion, with user info and the `state` and `nonce` in cookies, for agent (browser) to redirect to the SAML service provider.

## Configuration

Whole configuration can be done with environment variable or `.env`.

API usage is provided by OpenAPI.

### Express.js

This section is Optional.

- `NODE_ENV`: Use `local` if want to use Express.js.
- `HOST`: The host that Express.js will listen on.
- `PORT`: The port that Express.js will listen on.

### Cookies

Consider this as confidential information and rotate it regularly.
While rotation happened, only the ongoing auth will be reset.

- `COOKIE_SECRET`: The secret will be used to encrypt `state` and `nonce` in SAML auth request.

### Amazon Cognito

- `BASE_URL`: The base URL will be called.
- `AWS_COGNITO_REGION`: The region.
- `AWS_COGNITO_USER_POOL_ID`: The User Pool ID.
- `AWS_COGNITO_CLIENT_ID`: The client ID in the User Pool.
- `AWS_COGNITO_CLIENT_SECRET`: The client secret in the User Pool.

#### Client Configuration

- Callback URL: `{{BASE_URL}}/oidc/callback`.
- Authorization code grant.
- OpenID scope.
- Any other scopes required by SAML service provider.

### SAML Identity Provider

The certificate can be self signed or CA issued.

- `SAML_IDENTITY_PROVIDER_CERTIFICATE`: The certificate will be provided to SAML service provider.
- `SAML_IDENTITY_PROVIDER_PRIVATE_KEY`: The private key will be used to sign SAML assertion.

### SAML Service Provider

`x`, `y`, and `z` represent any numbers.

Each same `x`, `y`, or `z` represent a set of configuration.

- `SAML_SERVICE_PROVIDER_x_ID`: The user given ID. Can get IdP metadata by accessing `{{BASE_URL}}/saml/metadata` or `{{HOST}}:{{PORT}}/saml/metadata`.
- `SAML_SERVICE_PROVIDER_x_ENTITY_ID`: The entity ID of service provider.
- `SAML_SERVICE_PROVIDER_x_ASSERTION_CONSUMER_SERVICE_y_IS_DEFAULT`: (Optional, `true` or `false`) Whether the assertion consumer service set should be treated as default value.
- `SAML_SERVICE_PROVIDER_x_ASSERTION_CONSUMER_SERVICE_y_BINDING`: The binding of the assertion consumer service set.
- `SAML_SERVICE_PROVIDER_x_ASSERTION_CONSUMER_SERVICE_y_LOCATION`: The location of the assertion consumer service set.
- `SAML_SERVICE_PROVIDER_x_SINGLE_LOGOUT_SERVICE_z_IS_DEFAULT`: (Optional, `true` or `false`) Whether the single logout service set should be treated as default value.
- `SAML_SERVICE_PROVIDER_x_SINGLE_LOGOUT_SERVICE_z_BINDING`: The binding of the single logout service set.
- `SAML_SERVICE_PROVIDER_x_SINGLE_LOGOUT_SERVICE_z_LOCATION`: The location of the single logout service set.
