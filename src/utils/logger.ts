import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const color: { [key: string]: string } = {
    info: '\x1b[36m',
    error: '\x1b[31m',
    warn: '\x1b[33m',
    debug: '\x1b[35m',
};

const customPrintFormat = winston.format.printf(({ level, message }) => {
    return `${level}: ${color[level] || ''} ${message}\x1b[0m `;
});

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            level: 'debug',
        })
    ],
    format: winston.format.combine(
        winston.format.prettyPrint(),
        winston.format.timestamp(),
        winston.format.json(),
        customPrintFormat,
    ),
});
export default logger;