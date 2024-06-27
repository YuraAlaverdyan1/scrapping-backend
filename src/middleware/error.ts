import { NextFunction, Request, Response } from 'express';

import logger from '../utils/logger';
import { CustomError } from '../utils/customError';
import { ResponseHandler } from '../utils/responseHandler';

// Middleware to handle errors
export const handleError = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err) {
        logger.error(`ERROR: ${err}`);

        const errorObject = new CustomError('Internal Server Error', 500, true);

        return ResponseHandler.sendResponse(res, req, errorObject, 200, '');
    }
    next();
};