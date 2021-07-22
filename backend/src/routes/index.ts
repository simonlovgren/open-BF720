import { Router } from 'express';
import manageRouter from './manage';
import userRouter from './user'
import measurementsRouter from './measurments'

const routes = Router();

routes.use('/manage', manageRouter);
routes.use('/user', userRouter);
routes.use('/measurements', measurementsRouter);

export default routes;