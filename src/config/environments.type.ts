export interface ExtensionITF {
    id: string;
    connectionSelector: string;
    path: string;
    loadedSelector: string;
}

export type ExtensionMapping = Record<keyof typeof ExtensionListE, ExtensionITF>;

export enum ExtensionListE {
    TOUCH_VPN = 'TOUCH_VPN'
}

export type ClientURLMapping = Record<keyof typeof ClientListE, string>;

export enum ClientListE {
    ZILLOW = 'ZILLOW',
    SUGGESTION = 'SUGGESTION'
}