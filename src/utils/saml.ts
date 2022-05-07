import {IdentityProviderInstance} from 'samlify';
import {SAML_IDENTITY_PROVIDER_SETTINGS} from '@@src/config';

export function generateIdp(serviceProviderId: string): IdentityProviderInstance {
    return new IdentityProviderInstance({
        ...SAML_IDENTITY_PROVIDER_SETTINGS,
        /* eslint-disable @typescript-eslint/naming-convention */
        entityID:            `${SAML_IDENTITY_PROVIDER_SETTINGS.entityID ?? ''}?spId=${serviceProviderId}`,
        singleSignOnService: SAML_IDENTITY_PROVIDER_SETTINGS.singleSignOnService?.map((v) => ({
            ...v,
            Location: `${v.Location}?spId=${serviceProviderId}`,
        })),
        /* eslint-enable @typescript-eslint/naming-convention */
    });
}
