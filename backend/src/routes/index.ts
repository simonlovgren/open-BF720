/**
 * ==========================================================================
 * Imports
 * ==========================================================================
 */
import { Router } from 'express';
import manageRouter from './manage';
import userRouter from './user'
import measurementsRouter from './measurments'

/**
 * ==========================================================================
 * Variables
 * ==========================================================================
 */
const routes = Router();

/**
 * ==========================================================================
 * Root routes
 * ==========================================================================
 */
routes.use('/manage', manageRouter);
routes.use('/user', userRouter);
routes.use('/measurements', measurementsRouter);

routes.use('/', (request, response) => {
    return response.json({'version':'1.0.0'});
});

/**
 * ==========================================================================
 * Exports
 * ==========================================================================
 */
export default routes;