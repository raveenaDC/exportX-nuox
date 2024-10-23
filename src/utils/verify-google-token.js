import axios from 'axios';

export async function verifyGoogleToken(accessToken) {
  try {
    const response = await axios.get(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const userInfo = response.data;
    return { isError: false, data: userInfo };
  } catch (error) {
    return { isError: true, error };
  }
}
