import * as models from '../../db/models/index.js';
import { generateJwtToken } from '../encryption.helper.js';
const TOKEN_EXPIRY_TIME = process.env.TOKEN_EXPIRE_TIME;
export async function generateAndSaveAccessToken(
  userType = 'user',
  userId = '',
  role = ''
) {
  let payload;
  if (userType === 'user') {
    payload = { userId, role };
  } else if (userType === 'client') {
    payload = { clientId: userId, role };
  } else if (userType === 'client user') {
    payload = { clientUserId: userId, role };
  }
  const accessToken = await generateJwtToken(payload, TOKEN_EXPIRY_TIME);

  await models.tokenModel.create({
    userId,
    token: accessToken,
    tokenType: 'authentication',
  });

  return accessToken;
}
