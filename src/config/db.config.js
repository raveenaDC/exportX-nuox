import * as dotenv from 'dotenv';
dotenv.config();
export const mongoUrl = process.env.MONGODB_CONNECTION_STRING;
