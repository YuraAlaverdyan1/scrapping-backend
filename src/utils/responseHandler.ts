import { Request, Response } from 'express';

import { CustomError } from './customError';
import logger from './logger';

export class ResponseHandler {
    public static createResponseObject(
        data: unknown,
        message: string,
        code: number,
        errorData?: unknown,
    ) {
        return {
            data,
            message,
            code,
            errorData: errorData || null,
        };
    }

    public static sendResponse(
        res: Response,
        req: Request,
        data: unknown,
        statusCode: number,
        message: string,
    ) {
        if (data instanceof CustomError) {
            if (data.isLogging) logger.error(`Path: ${req.originalUrl}; \n Error: ${data.message}`);

            const errorResponse = this.createResponseObject(
                null,
                data.message,
                data.statusCode,
                data?.errorData,
            );
            return res.status(errorResponse.code).send(errorResponse);
        }

        const successResponse = this.createResponseObject(data, message, statusCode);

        res.status(successResponse.code).send(successResponse);
        logger.info(`Path: ${req.originalUrl}; \n Success: Data sent successfully`);
    }
}