import puppeteer, { Browser, Page } from 'puppeteer';
import logger from '../logger';
import { CustomError } from '../customError';
import { EXTENSION } from '../../config/environments';
import path from 'node:path';

// process.env.PUPPETEER_DOWNLOAD_PATH = path.resolve(__dirname, '../../../hopar');

class PuppeteerBrowser {
    instance: Browser;

    constructor() {
    }

    async initWithVPN(headless: boolean) {
        try {
            const vpnExtension = EXTENSION.TOUCH_VPN;
            this.instance = await puppeteer.launch({
                headless,
                executablePath:  path.resolve(__dirname, '../../../browser/google/chrome/chrome'),
                defaultViewport: {
                    width: 1920,
                    height: 1080
                },
                args: [
                    '--auto-open-devtools-for-tabs',
                    `--disable-extensions-except=${vpnExtension.path}`,
                    `--load-extension=${vpnExtension.path}`,
                    '--window-size=1920,1080'
                ],
                timeout: 100000
            });

            const extensionPageURL = 'chrome://extensions/';

            const vpnPage = await this.instance.newPage();
            await vpnPage.goto(extensionPageURL, { waitUntil: 'networkidle0' });

            // Extract installed extension IDs
            const extensionIDs = await vpnPage.evaluate((): string[] => {
                const getExtensionItems = (root: ShadowRoot): string[] => {
                    const items = root.querySelectorAll('extensions-item');
                    return Array.from(items).map(item => item.id);
                };

                const extensionsManager = document.querySelector('extensions-manager') as HTMLElement;
                const shadowRoot = extensionsManager.shadowRoot as ShadowRoot;
                const itemsContainer = shadowRoot.querySelector('#items-list') as HTMLElement;

                return getExtensionItems(itemsContainer.shadowRoot as ShadowRoot);
            });

            if (!extensionIDs) {
                logger.error(`BROWSER: Error initializing extension`);
                return new CustomError('Internal Server Error', 500, true);
            }

            // Navigate to the extension's UI and perform necessary actions to connect to VPN
            const extensionPopupUrl = `chrome-extension://${extensionIDs}/panel/index.html`;
            await vpnPage.goto(extensionPopupUrl);

            // Interact with the extension's UI to connect to the VPN server
            await vpnPage.waitForSelector(vpnExtension.connectionSelector);
            await vpnPage.click(vpnExtension.connectionSelector);

            // Wait for a few seconds to ensure the VPN connection is established
            await vpnPage.waitForSelector(vpnExtension.loadedSelector);

            //Close the vpn UI tab
            await vpnPage.close();
            logger.info(`BROWSER:Connection established.`);
        } catch (error) {
            logger.error(`BROWSER: Error initializing browser: \n ${error}`);
            return new CustomError('Internal Server Error', 500, true);
        }
    }

    static async slowScrollElementToBottom(page: Page, selector: string) {
        return await page.evaluate(async (selector) => {
            const element = document.querySelector(selector);
            if (element) {
                const scrollHeight = element.scrollHeight;
                const distance = 100; // Distance to scroll per step
                const delay = 200; // Delay between each step in milliseconds

                // Loop to scroll gradually to the bottom
                for (let i = 0; i < scrollHeight; i += distance) {
                    element.scrollTop = i;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                return true;
            } else {
                logger.warning(`Scrollable element not found: ${selector}`);
                return false;
            }
        }, selector);
    }
}

export default PuppeteerBrowser;