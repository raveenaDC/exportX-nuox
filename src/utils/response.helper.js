import httpStatus from 'http-status';
/**
 * format response.
 * @param {Response} res
 * @param {Number} status
 * @param {Boolean} isError
 * @param {String} message
 * @param {Object|Null} data
 * @returns {Object}
 */
const makeFirstLetterCapital = (str) =>
  str ? str[0].toUpperCase() + str.slice(1) : '';
export function responseHelper(
  res,
  status = httpStatus.OK,
  isError = true,
  message = '',
  data = {}
) {
  return res.status(status).json({
    status,
    isError,
    message: makeFirstLetterCapital(message),
    data,
  });
}
