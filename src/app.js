import express from 'express';
import * as dotenv from 'dotenv';
import morganLogger from 'morgan';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { createServer } from 'http';
import helmet from 'helmet';

import mongoDb from './db/mongo-db.js';
import { getCurrentWorkingFolder } from './utils/get-current-working-folder.helper.js';
import initializeRoutes from './routes/index.js';
import { RateLimiter } from './config/rate.limit.config.js';
import { logOutgoingRequests } from './middle.js';
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const httpServer = createServer(app);
const dirname = getCurrentWorkingFolder(import.meta.url);

async function main() {
  try {
    await mongoDb.createConnection();

    //global middlewares
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(morganLogger('dev'));
    app.use(cors({ origin: '*' }));
    // app.use(helmet());
    // app.use(RateLimiter);

    app.use('/cdn', express.static(path.join(dirname, '../', 'public'))); //static assets
    initializeRoutes(app);
    app.listen(port, () => {
      console.log('Server is running on : ', port);
    });
  } catch (error) {
    console.log('something went wrong while starting server....', error);
  }
}

main();
