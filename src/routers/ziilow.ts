import express from 'express';

import { ZillowController } from '../controllers/zillow';

const zillowRouter = express.Router();

zillowRouter.post('/getFromLink', ZillowController.getPropertiesFromLink);
zillowRouter.post('/suggestions', ZillowController.getSuggestions);
zillowRouter.post('/getWithFilters',  ZillowController.getWithFilters);

export default zillowRouter;