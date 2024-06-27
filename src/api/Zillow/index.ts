import { Page } from 'puppeteer';

import { FilterOptionsITF, ScrapedZillowDataITF, ZillowListOptionITF } from './types';
import { CLIENT_URLS } from '../../config/environments';
import { CustomError } from '../../utils/customError';
import PuppeteerBrowser from '../../utils/browser';

import logger from '../../utils/logger';
import GlobalHelpers from '../../utils/helper';
import axios from 'axios';

class ZillowScrapper {
    static captchaSelector = '#px-captcha';
    static containerSelector = '.ds-container';
    static presentationSelector = 'div[role="presentation"]';
    static presentationPriceSelector = '.price-text';
    static presentationAddressSelector = '.sc-kIlzlo h1';
    static presentationCompanySelector = 'p[data-testid="attribution-BROKER"] span:last-child';
    static presentationPhoneNumberSelector = 'p[data-testid="attribution-LISTING_AGENT"] span:last-child';
    static scrollElementSelector = '.short-list-cards';
    static priceBoxSelector = 'span[data-testid="price"]';
    static containerLoaderSelector = '.nchdc__sc-wc5oqa-1';
    static addressSelectorDSContainer = '.nchdc__sc-1mpbn3p-0 h1';
    static elementSelector = '.ListItem-c11n-8-100-8__sc-13rwu5a-0';
    static listContainer = '.result-list-container ul';
    static phoneNumberSelectorDSContainer = '.nchdc__sc-wc5oqa-1 div';
    static linkSelector = '.StyledPropertyCardDataArea-c11n-8-100-8__sc-10i1r6-0';
    static addressSelector = '.styles__AddressWrapper-fshdp-8-100-2__sc-13x5vko-0';
    static paginationElementsSelector = '.PaginationButton-c11n-8-100-8__sc-1i6hxyy-0';
    static listingAgentSelector = 'p[data-testid="attribution-LISTING_AGENT"]';
    static listingAgentLoaderSelector = '.SellerAttributionStyles__StyledListedBy-fshdp-8-100-2__sc-5b3vve-0';
    static brokerSelector = 'p[data-testid="attribution-BROKER"] span:last-child';
    static phoneNumberSelector = 'p[data-testid="attribution-LISTING_AGENT"] span:last-child';

    static async getLocationSuggestions(text: string) {
        try {
            logger.debug(`ZILLOW SCRAPPER: Starting to get location suggestions..`);

            const searchQuery = {
                resultTypes: 'allRegion',
                resultCount: '10',
                q: text
            };
            const searchURL = `${CLIENT_URLS.SUGGESTION}?${new URLSearchParams(searchQuery).toString()}`;

            const response = await axios.get(searchURL);

            return response.data;
        } catch (error) {
            logger.error(`ZILLOW SCRAPPER: Error while getting location suggestions \n ${error}`);
            return new CustomError('Error while getting location suggestions', 500, true);
        }
    }

    static generateSearchURL(sortOption: string, filterOptions: Partial<FilterOptionsITF>, country?: string) {
        logger.debug('ZILLOW SCRAPPER: Starting to generate search URL...');
        // Construct the base URL
        const baseURL = !country ? `${CLIENT_URLS.ZILLOW}/homes/for_sale` : `${CLIENT_URLS.ZILLOW}/${country?.trim().toLowerCase().replace(/,/g, '').split(' ').join('-')}`;

        // Create an object to represent the search query state
        const searchQueryState = {
            pagination: {},
            isMapVisible: false,
            mapZoom: 11,
            usersSearchTerm: '',
            filterState: {
                sort: { value: sortOption },
                ...filterOptions // Merge additional filter options
            },
            isListVisible: true
        };

        // Encode the search query state as a URL parameter
        const searchQueryStateParam = encodeURIComponent(JSON.stringify(searchQueryState));

        logger.info('ZILLOW SCRAPPER: Link generated successfully !');
        // Construct the final URL with the searchQueryState parameter
        return `${baseURL}?searchQueryState=${searchQueryStateParam}`;
    }

    static async scrapPageElements(page: Page) {
        try {
            logger.debug('ZILLOW SCRAPPER: Starting to scrap page elements...');

            // Scroll list for loading all content
            await PuppeteerBrowser.slowScrollElementToBottom(page, this.scrollElementSelector);

            // Remove all iframes from the DOM for performance
            await page.evaluate(() => {
                document.querySelectorAll('iframe').forEach(iframe => iframe.remove());
            });

            const elementArray: ZillowListOptionITF[] = [];

            await page.waitForSelector(this.listContainer);

            const elementListContainer = await page.$(this.listContainer);

            if (!elementListContainer) {
                logger.error('ZILLOW SCRAPPER: No list container found');
                return new CustomError('No list container found', 400, true);
            }

            await page.waitForSelector(this.elementSelector);

            const elements = await elementListContainer.$$('article');

            await Promise.allSettled(
                elements.map(async option => {
                    const property = await option.$(this.linkSelector);

                    if (property) {
                        const link = await property.evaluate(el => el.getAttribute('href'));
                        const title = await property.evaluate(el => el.textContent);

                        elementArray.push({
                            link: link ?? '',
                            title: title ?? ''
                        });
                    }
                })
            );

            logger.info(`ZILLOW SCRAPPER: Links scrapped successfully`);
            return elementArray;
        } catch (error) {
            logger.error(`Error Scraping page: \n ${error}`);
            return new CustomError('Error scraping page', 500, true);
        }
    }

    static async scrapFromPagination(page: Page, url: string) {
        try {
            logger.debug('ZILLOW SCRAPPER: Starting scrap with Pagination');

            await page.goto(url, { waitUntil: 'domcontentloaded' });

            const isCaptchaRequired = await page.$(this.captchaSelector);

            if (isCaptchaRequired) {
                await this.bypassCaptcha(page);
            }

            await page.waitForSelector(this.listContainer);

            //Get pagination from DOM
            let pages = await this.getPages(page);

            let isNextDisabled: string | undefined | null = 'false';

            const elementsFromPagination: ZillowListOptionITF[] = [];

            while (isNextDisabled === 'false') {
                logger.info('ZILLOW SCRAPPER: Starting scrap page...');

                const elements = await this.scrapPageElements(page);

                if (elements instanceof CustomError) {
                    //Changing to stop while loop
                    isNextDisabled = 'true';
                    return elements;
                }

                elementsFromPagination.push(...elements);

                isNextDisabled = await pages?.at(-1)?.evaluate((selector) => {
                    return selector.ariaDisabled; // Treat as disabled if anchor element not found
                });

                await pages?.at(-1)?.click();

                pages = await this.getPages(page);

                await GlobalHelpers.waitForTimeout(2000);
            }

            logger.info('ZILLOW SCRAPPER: Completed scrap page !');
            return elementsFromPagination;
        } catch (error) {
            logger.error(`Error Scraping page: \n ${error}`);
            return new CustomError('Error scraping page', 500, true);
        }
    }

    static async scrapFromLinks(elements: ZillowListOptionITF[], numberOfEachPage: number) {
        try {
            logger.debug('ZILLOW SCRAPPER: Starting scrap from links...');

            //Divide elements into parts for performance
            const dividedElements = GlobalHelpers.divideArrayIntoParts(elements, numberOfEachPage);

            const totalResults: ScrapedZillowDataITF[] = [];

            for (let i = 0; i < dividedElements.length; i++) {
                logger.info('ZILLOW SCRAPPER: Starting scrap from links with new browser...');
                //Create browser for changing IP with VPN for each ${numberOfEachPage} number of elements
                const browser = new PuppeteerBrowser();
                await browser.initWithVPN(false);

                const audience = dividedElements[i];

                const promiseFromElements = audience.map(async listOption => {
                    const page = await browser.instance.newPage();
                    return this.scrapFromLink(listOption.link, page);
                });

                const results = await Promise.allSettled(promiseFromElements);

                totalResults.push(...results
                    .filter((result): result is PromiseFulfilledResult<ScrapedZillowDataITF> => result.status === 'fulfilled')
                    .map((result) => (result as PromiseFulfilledResult<ScrapedZillowDataITF>).value)
                );
                await GlobalHelpers.waitForTimeout(2000);
                await browser.instance.close();
                logger.info('ZILLOW SCRAPPER: Browser elements scrapped successfully !');
            }

            logger.info('ZILLOW SCRAPPER: Completed scrap from links !');
            return totalResults;
        } catch (error) {
            logger.error(`ZILLOW SCRAPPER: Failed to scrap links: \n ${error}`);
            return new CustomError('Error scraping page', 500, true);
        }
    }

    static async getPages(page: Page) {
        return await page.$$(this.paginationElementsSelector);
    }

    static async bypassCaptcha(page: Page) {
        try {
            logger.debug('ZILLOW SCRAPPER: Starting to bypass captcha...');

            //Waiting for captcha visible
            await page.waitForSelector('#px-captcha', { visible: true });

            const rect = await page.$eval('#px-captcha', el => {
                const {
                    x,
                    y,
                    width,
                    height
                } = el.getBoundingClientRect();
                return {
                    x,
                    y,
                    width,
                    height
                };
            });

            await GlobalHelpers.waitForTimeout(2000);

            await page.mouse.move((rect.x + (rect.width / 2)) + 10, (rect.y + (rect.height / 2)) + 10);
            await page.mouse.down();

            //Waiting 10s for resolving captcha
            await GlobalHelpers.waitForTimeout(10000);

            await page.mouse.up();

            logger.info('ZILLOW SCRAPPER: Captcha passed successfully !');
        } catch (error) {
            logger.error(`ZILLOW SCRAPPER: Failed to pass captcha \n ${error}`);
        }
    }

    static async scrapElementInfo(page: Page) {
        try {
            logger.debug('ZILLOW SCRAPPER: Starting to scrap element info...');

            page.setDefaultTimeout(60000);
            // Detect container type
            const dsContainer = await page.evaluate((containerSelector) => {
                const container = document.querySelector(containerSelector);
                if (!container) return false;
                return container.innerHTML.trim().length > 0;
            }, this.containerSelector);

            if (!dsContainer) {
                const animationContainer = await page.evaluate((containerSelector) => {
                    const container = document.querySelector(containerSelector);
                    if (!container) return false;
                    return container.innerHTML.trim().length > 0;
                }, this.presentationSelector);

                // Create separate way for scraping from presentation
                if (animationContainer) {
                    await page.waitForSelector(this.presentationPhoneNumberSelector);

                    const detail = await this.scrapFromAnimationContainer(page);

                    if (!(detail instanceof CustomError)) {
                        return detail;
                    }

                    return detail;
                }


                await page.waitForSelector(this.phoneNumberSelector);
            } else {
                const phoneNumberSelector = await page.evaluate((phoneNumberSelector) => {
                    const selector = document.querySelector(phoneNumberSelector);

                    if (!selector) return false;
                    return selector.innerHTML.trim().length > 0;
                }, this.phoneNumberSelectorDSContainer);
                if (phoneNumberSelector) {
                    await page.waitForSelector(this.phoneNumberSelectorDSContainer);
                } else {
                    const dsContainerPhoneNumber2 = await page.evaluate(() => {
                        const selector = document.querySelector('.nchdc__sc-12z803w-0');
                        if (!selector) return false;

                        return selector.innerHTML.trim().length > 0;
                    });
                    if (dsContainerPhoneNumber2) {
                        await page.waitForSelector('.nchdc__sc-12z803w-0');
                        return await this.scrapFromDsContainer2(page);
                    } else {
                        await page.waitForSelector(this.phoneNumberSelector);
                    }
                }
            }

            const details: ScrapedZillowDataITF = await page.evaluate((
                {
                    containerSelector,
                    priceBoxSelector,
                    addressSelector,
                    addressSelectorDSContainer,
                    phoneNumberSelector,
                    phoneNumberSelectorDSContainer,
                    brokerSelector
                }) => {
                const fromPrice = document.querySelector(containerSelector);

                const priceElement = document.querySelector(priceBoxSelector);
                const addressElement = document.querySelector(!fromPrice ? addressSelector : addressSelectorDSContainer);
                const phoneNumberElement = document.querySelector(!fromPrice ? phoneNumberSelector : phoneNumberSelectorDSContainer);
                const companyElement = document.querySelector(brokerSelector);
                return {
                    price: priceElement ? priceElement.textContent?.trim() : null,
                    address: addressElement ? addressElement.textContent?.trim() : null,
                    phoneNumber: phoneNumberElement ? phoneNumberElement.textContent?.trim().replace(',', '') : null,
                    companyElement: companyElement ? companyElement.textContent?.trim() : null
                };
            }, {
                containerSelector: this.containerSelector,
                priceBoxSelector: this.priceBoxSelector,
                addressSelector: this.addressSelector,
                addressSelectorDSContainer: this.addressSelectorDSContainer,
                phoneNumberSelector: this.phoneNumberSelector,
                phoneNumberSelectorDSContainer: this.phoneNumberSelectorDSContainer,
                brokerSelector: this.brokerSelector
            });

            logger.info('ZILLOW SCRAPPER: Element info scrapped !');

            return details;
        } catch (error) {
            logger.error(`ZILLOW SCRAPPER: Failed to scrap element info: \n ${error}`);
            return new CustomError('Failed to scrap element info', 500, true);
        }
    }

    static async scrapFromAnimationContainer(page: Page) {
        try {
            logger.debug('ZILLOW SCRAPPER: Starting to scrap from presentation container');

            const details: ScrapedZillowDataITF = await page.evaluate((
                {
                    priceBoxSelector,
                    addressSelector,
                    phoneNumberSelector,
                    brokerSelector
                }) => {
                const priceElement = document.querySelector(priceBoxSelector);
                const addressElement = document.querySelector(addressSelector);
                const phoneNumberElement = document.querySelector(phoneNumberSelector);
                const companyElement = document.querySelector(brokerSelector);
                return {
                    price: priceElement ? priceElement.textContent?.trim() : null,
                    address: addressElement ? addressElement.textContent?.trim() : null,
                    phoneNumber: phoneNumberElement ? phoneNumberElement.textContent?.trim().replace(',', '') : null,
                    companyElement: companyElement ? companyElement.textContent?.trim() : null
                };
            }, {
                priceBoxSelector: this.presentationPriceSelector,
                addressSelector: this.presentationAddressSelector,
                phoneNumberSelector: this.presentationPhoneNumberSelector,
                brokerSelector: '.nchdc__sc-wc5oqa-4 > .Text-c11n-8-100-2__sc-aiai24-0'
            });

            return details;
        } catch (error) {
            logger.error(`ZILLOW SCRAPPER: Failed to scrap from presentation container: \n ${error}`);
            return new CustomError('Failed to scrap from presentation container', 500, true);
        }
    }

    static async scrapFromDsContainer2(page: Page) {
        try {
            logger.debug('ZILLOW SCRAPPER: Starting to scrap from ds 2 container');

            const details: ScrapedZillowDataITF = await page.evaluate((
                {
                    priceBoxSelector,
                    addressSelector,
                    phoneNumberSelector,
                    brokerSelector
                }) => {
                const priceElement = document.querySelector(priceBoxSelector);
                const addressElement = document.querySelector(addressSelector);
                const phoneNumberElement = document.querySelector(phoneNumberSelector);
                const companyElement = document.querySelector(brokerSelector);
                return {
                    price: priceElement ? priceElement.textContent?.trim() : null,
                    address: addressElement ? addressElement.textContent?.trim() : null,
                    phoneNumber: phoneNumberElement ? phoneNumberElement.textContent?.trim().replace(',', '') : null,
                    companyElement: companyElement ? companyElement.textContent?.trim() : null
                };
            }, {
                priceBoxSelector: this.priceBoxSelector,
                addressSelector: this.addressSelectorDSContainer,
                phoneNumberSelector: '.nchdc__sc-12z803w-0',
                brokerSelector: this.presentationCompanySelector
            });

            return details;
        } catch (error) {
            logger.error(`ZILLOW SCRAPPER: Failed to scrap from presentation container: \n ${error}`);
            return new CustomError('Failed to scrap from presentation container', 500, true);
        }
    }

    static async scrapFromLink(link: string, page: Page) {
        try {
            logger.debug('ZILLOW SCRAPPER: Starting to scrap from link...');

            await page.goto(link, {
                waitUntil: 'domcontentloaded',
                timeout: 80000
            });

            const isCaptchaRequired = await page.$(this.captchaSelector);

            if (isCaptchaRequired) {
                await page.waitForSelector(this.captchaSelector);
                await this.bypassCaptcha(page);
            }

            const detail = await this.scrapElementInfo(page);

            await page.close();

            return detail;
        } catch (error) {
            logger.error(`ZILLOW SCRAPPER: Failed to scrap element info: \n ${error}`);
            return new CustomError('Failed to scrap element info', 500, true);
        }
    }
}

export default ZillowScrapper;