import { TYPE_OF_PROPERTIES } from './types';

export const propertySelectors = {
    [TYPE_OF_PROPERTIES.TYPE1]: {
        price: 'span[data-testid="price"]',
        addressSelector: '.styles__AddressWrapper-fshdp-8-100-2__sc-13x5vko-0',
        phoneNumberSelector: '.SellerAttributionStyles__StyledListedBy-fshdp-8-100-2__sc-5b3vve-0 p[data-testid="attribution-LISTING_AGENT"] span:last-child',
        brokerSelector: '.SellerAttributionStyles__StyledListedBy-fshdp-8-100-2__sc-5b3vve-0 p[data-testid="attribution-BROKER"] span:last-child',
    },
    [TYPE_OF_PROPERTIES.TYPE2]: {
        price: 'span[data-testid="price"]',
        addressSelector: '.nchdc__sc-1mpbn3p-0 h1',
        phoneNumberSelector: '.nchdc__sc-wc5oqa-1 div',
        brokerSelector: '.SellerAttributionStyles__StyledListedBy-fshdp-8-100-2__sc-5b3vve-0 p[data-testid="attribution-BROKER"] span:last-child',
    },
    [TYPE_OF_PROPERTIES.TYPE3]: {
        price: 'span[data-testid="price"]',
        addressSelector: '.PriceChangeAndAddressRow__StyledPriceChangeAndAddressRow-fshdp-8-100-2__sc-riwk6j-0  h1',
        phoneNumberSelector: '.SellerAttributionStyles__StyledListedBy-fshdp-8-100-2__sc-5b3vve-0 p[data-testid="attribution-LISTING_AGENT"] span:last-child',
        brokerSelector: '.SellerAttributionStyles__StyledListedBy-fshdp-8-100-2__sc-5b3vve-0 p[data-testid="attribution-BROKER"] span:last-child',
    }
};