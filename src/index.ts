import express from 'express';
import cors from 'cors';

import mainRouter from './routers';
import { handleError } from './middleware/error';

import logger from './utils/logger';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const corsOptions = {
    origin: '*',
    credentials: true, // This allows the session cookie to be sent back and forth
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204,
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    // and the other ones you need...
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    next();
});

app.use('/api', mainRouter);

app.get('/', async (req, res) => {
    res.send('Hello World');
});

app.use(handleError);

app.listen(8080, () => {
    logger.info(`listening on port ${PORT}`);
});
