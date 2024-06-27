import express from 'express';

import zillowRouter from '../routers/ziilow';

const mainRouter = express.Router();

mainRouter.use('/zillow', zillowRouter);

export default mainRouter;