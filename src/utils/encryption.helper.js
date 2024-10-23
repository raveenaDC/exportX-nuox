import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import ms from 'ms';

/**
 * generate bcrypt hash the password.
 * @param {String} password
 * @returns {String}
 */
async function generatePasswordHash(password = '') {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * compare given password and password hash.
 * @param password
 * @param passwordHash
 * @returns {Boolean}
 */
async function comparePassword(password = '', passwordHash = '') {
  return bcrypt.compare(password, passwordHash);
}

/**
 * generate jwt token
 * @param {Object} data
 * @param {String} time
 * @returns {String}
 */
function generateJwtToken(data = {}, time = '') {
  if (time)
    return jwt.sign(data, process.env.JWT_SECRET_KEY, { expiresIn: time });
  return jwt.sign(data, process.env.JWT_SECRET_KEY);
}
/**
 * verify jwt token
 * @param {String} token
 * @returns {Object}
 */
//  function verifyJwtToken(token = '',time = '') {
//   try {
//     const data = jwt.verify(token, process.env.JWT_SECRET_KEY);
//     // const nowInSeconds = Math.floor(Date.now() / 1000);
//     // if (data.exp && data.exp < nowInSeconds) {
//     //   return { validToken: false, message: 'Token has expired' };
//     // }
//     // if (!data.exp && data.iat) {
//     //   const tokenExpirationInSeconds = Math.floor(ms(process.env.TOKEN_EXPIRE_TIME) / 1000);
//     //   if ((data.iat + tokenExpirationInSeconds) < nowInSeconds) {
//     //     return { validToken: false, message: 'Token has expired' };
//     //   }
//     // }
//     return { validToken: true, data };
//   } catch (error) {
//     return { validToken: false, message: 'Invalid token' };
//   }
// }
function verifyJwtToken(token = '') {
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET_KEY);
    return { validToken: true, data };
  } catch (error) {
    return { validToken: false };
  }
}

export {
  generatePasswordHash,
  comparePassword,
  generateJwtToken,
  verifyJwtToken,
};
