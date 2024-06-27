import { Request, Response } from 'express';

import { ZillowService } from '../services/zillowService';

import constants from '../utils/constants';
import { ResponseHandler } from '../utils/responseHandler';
import { FilterOptionsITF } from '../api/Zillow/types';

const getPropertiesFromLink = async (req: Request, res: Response) => {
    const response = await ZillowService.scrapFromAllPagesWithLink(req.body.url);

    return ResponseHandler.sendResponse(res, req, response, 200, constants.SUCCESS_MESSAGE);
};

const getSuggestions = async (req: Request, res: Response) => {
    const response = await ZillowService.getSuggestions(req.body.text);

    return ResponseHandler.sendResponse(res, req, response, 200, constants.SUCCESS_MESSAGE);
};

const getWithFilters = async (req: Request, res: Response) => {
    const response = await ZillowService.getWithFilters(req.body as { country?: string, filterState: Partial<FilterOptionsITF> });

    return ResponseHandler.sendResponse(res, req, response, 200, constants.SUCCESS_MESSAGE);
};

export const ZillowController = {
    getPropertiesFromLink,
    getSuggestions,
    getWithFilters
};