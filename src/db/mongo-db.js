import mongoose from 'mongoose';
import { mongoUrl } from '../config/db.config.js';
/**
 * create mongo db database connection.
 */
async function createConnection() {
  try {
    await mongoose.connect(mongoUrl, {});
    console.log('mongodb connection success.!!!');
  } catch (error) {
    console.log('mongodb connection error :', error.message);
  }
}

/**
 * close mongo db connection
 */
async function closeConnection() {
  await mongoose.connection.close();
  console.log('mongo db connection closed successfully');
}

/**
 * start mongodb transaction
 * @returns {session}
 */
async function startTransaction() {
  const session = await mongoose.startSession();
  session.startTransaction();
  return session;
}
/**
 * end mongo db transaction
 * @param {Session} session
 */
async function endTransaction(session) {
  await session.commitTransaction();
  session.endSession();
}

/**
 * abort mongo db transaction
 * @param {Session} session
 */
async function abortTransaction(session) {
  await session.abortTransaction();
  session.endSession();
}

export default {
  createConnection,
  closeConnection,
  startTransaction,
  endTransaction,
  abortTransaction,
};
