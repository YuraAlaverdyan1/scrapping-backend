import ZillowScrapper from '../api/Zillow';

import logger from '../utils/logger';
import PuppeteerBrowser from '../utils/browser';
import { CustomError } from '../utils/customError';
import GlobalHelpers from '../utils/helper';
import { FilterOptionsITF } from '../api/Zillow/types';

const scrapFromAllPagesWithLink = async (url: string) => {
    try {
        logger.debug('ZILLOW SERVICE: Starting scrap from all pages...');

        const browser = new PuppeteerBrowser();
        await browser.initWithVPN(true);

        const page = await browser.instance.newPage();

        const zillowListOptions = await ZillowScrapper.scrapFromPagination(page, url);

        if (zillowListOptions instanceof CustomError) {
            return zillowListOptions;
        }

        const numberListOptionsForEachPage = GlobalHelpers.numberListOptionsForEachPage(zillowListOptions);
        logger.info(`ZILLOW SERVICE: Number of list options for each page: ${numberListOptionsForEachPage}`);
        const scrapedData = await ZillowScrapper.scrapFromLinks(zillowListOptions, numberListOptionsForEachPage);

        if (scrapedData instanceof CustomError) {
            return scrapedData;
        }

        await browser.instance.close();
        return scrapedData;
    } catch (error) {
        logger.error(`ZILLOW SERVICE: Error while scraping from all pages ${error}`);
        return new CustomError('Error while scraping from all pages', 500, true);
    }
};

const getSuggestions = async (text: string) => {
    try {
        logger.debug(`ZILLOW SERVICE: Starting get suggestions...`);
        const suggestions = await ZillowScrapper.getLocationSuggestions(text);

        if (suggestions instanceof CustomError) {
            return suggestions;
        }

        logger.info(`ZILLOW SERVICE: Suggestions found successfully`);
        return suggestions;
    } catch (error) {
        logger.error(`ZILLOW SERVICE: Error while getting suggestions \n ${error}`);
        return new CustomError('Error while getting suggestions', 500, true);
    }
};

const getWithFilters = async (filterOptions: { country?: string, filterState: Partial<FilterOptionsITF> }) => {
    try {
        logger.debug(`ZILLOW SERVICE: Starting get properties with filters...`);

        const searchURL = ZillowScrapper.generateSearchURL('globalrelevanceex', filterOptions.filterState, filterOptions.country);

        const response = await scrapFromAllPagesWithLink(searchURL);

        if (response instanceof CustomError) {
            return response;
        }

        logger.info(`ZILLOW SERVICE: Properties found successfully`);
        return response;
    } catch (error) {
        logger.error(`ZILLOW SERVICE: Error while getting properties with filters \n ${error}`);
        return new CustomError('Error while getting properties with filters', 500, true);
    }
};

export const ZillowService = {
    scrapFromAllPagesWithLink,
    getSuggestions,
    getWithFilters
};