import dotenv from 'dotenv';
import path from 'node:path';
import { ClientListE, ClientURLMapping, ExtensionListE, ExtensionMapping } from './environments.type';

dotenv.config();

export const CORE = {
    PORT: process.env.PORT || 3000
};

export const EXTENSION: ExtensionMapping = {
    [ExtensionListE.TOUCH_VPN]: {
        id: process.env.TOUCH_VPN_ID ?? '',
        connectionSelector: '#ConnectionButton',
        path: path.resolve(__dirname, '../extensions/vpn'),
        loadedSelector: '.browsingFromText'
    },
};

export const CLIENT_URLS: ClientURLMapping = {
    [ClientListE.ZILLOW]: process.env.ZILLOW_URL ?? '',
    [ClientListE.SUGGESTION]: process.env.ZILLOW_SUGGESTIONS_URL ?? ''
};