import 'reflect-metadata';
import config from './config';
import express from 'express';

import pino  from 'pino';
import expressPino from 'express-pino-logger';

import routes from './routes';

import cron from 'node-cron';
import UserService from './services/UserService';
import {Container} from 'typedi';
import ScaleService from './services/ScaleService';
const cors = require('cors')



require('./loader').default();

const logger = pino({ level: config.logs.level });
const expressLogger = expressPino({ logger });

const startRestServer = async () => {
  const app = express();

  app.use(cors({ origin: '*' }))
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(expressLogger);
  app.use(routes);

  app.listen(config.port, () => {
    logger.info(`
      ##########################################################
      🛡️    BF720 REST API listening on port: ${config.port}  🛡️
      ##########################################################
    `);
  }).on('error', err => {
    logger.error(err);
    process.exit(1);
  });
}

const sleep = (ms) => new Promise((resolve) => {setTimeout(resolve, ms);});

cron.schedule(config.cron_schedule_sync, async () => {
  console.log('-------------------');
  const userService = Container.get(UserService);
  const scaleService = Container.get(ScaleService);
  
  for (const user of userService.listUsersProfiles()){
    console.log(`Syncing user: ${user.name}...`);
    await userService.loginUser(user).catch(error => console.log(`User sync error...${error}`));
    await sleep(20000);
    console.log(`Sync for user completed.`);
  }
  console.log(`All users synced. Disconnecting...`);
  scaleService.disconnect();
});

startRestServer();