import axios from 'axios';
import * as models from '../../db/models/index.js';
import fs from 'fs';
const url = process.env.AI_BACKEND;
const apiUsername = process.env.AI_API_USERNAME;
const apiPassword = process.env.AI_API_PASSWORD;
const forBiddenMessage = 'Forbidden';
// create axios instance
const Axios = axios.create({
  baseURL: url,
  headers: {
    'Content-Type': 'application/json',
  },
});
Axios.interceptors.request.use((config) => {
  console.log(
    'Outgoing request: ',
    config.method.toUpperCase(),
    config.baseURL + config.url
  );
  return config;
});

/**
 * set token in database and deactivate old access tokens
 * @param {String} token
 */
async function setToken(token) {
  if (!token) throw new Error('Token is required');

  await models.tokenModel.updateMany(
    { tokenType: 'ai_auth' },
    { active: false }
  );

  await models.tokenModel.create({
    token,
    tokenType: 'ai_auth',
    userId: '657bd77fd2e310c40797ea78', // a dummy user id
  });
}

// get token from database
async function getToken() {
  const tokenDb = await models.tokenModel.findOne({
    tokenType: 'ai_auth',
    active: true,
  });
  return tokenDb?.token;
}

//create auth headers object with token
function getAuthHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}

async function loginUser() {
  try {
    const response = await Axios.post('/login', {
      username: apiUsername,
      password: apiPassword,
    });

    const token = response.data.token;
    await setToken(token);
  } catch (error) {
    if (error.response) throw error.response.data.error;
    throw error;
  }
}

async function generateOpenAiText(prompt = '') {
  try {
    if (!prompt) throw 'Prompt is required';

    const response = await Axios.post('/openAI/text', { prompt });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data.error === forBiddenMessage) {
      await loginUser();
      const response = await Axios.post('/openAI/text', { prompt });
      return `${response.data}`;
    }

    throw error.response?.data?.error || error;
  }
}

async function generateBardText(prompt = '') {
  try {
    if (!prompt) throw 'Prompt is required';
    const response = await Axios.post('/bard', { prompt });
    return response.data;
    console.log(response.data.output);
  } catch (error) {
    if (error.response && error.response.data.error === forBiddenMessage) {
      await loginUser();
      const response = await Axios.post('/bard', { prompt });
      return response.data;
    }

    throw error.response?.data?.error || error;
  }
}

async function generateImage(prompt = '') {
  try {
    if (!prompt) throw 'Prompt is required';
    const response = await Axios.post('/openAI/generateImage', { prompt });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data.error === forBiddenMessage) {
      await loginUser();
      const response = await Axios.post('/openAI/generateImage', { prompt });
      return response.data;
    }

    throw error.response?.data?.error || error;
  }
}

async function extractSiteInfo(url = '') {
  try {
    if (!url) throw 'Url is required';
    const response = await Axios.post('/extractinfo', { url });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data.error === forBiddenMessage) {
      await loginUser();
      const response = await Axios.post('/extractinfo', { prompt });
      return response.data;
    }

    throw error.response?.data?.error || error;
  }
}

async function extractColors(logo) {
  if (!logo) throw 'Logo is required';
  const formData = new FormData();
  let logoImage = logo.logoImage[0].path;
  formData.append('logo', logoImage);
  try {
    const response = await Axios.post('/extractinfo/extractColors', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data.error === forBiddenMessage) {
      await loginUser();
      const response = await Axios.post('/extractinfo/extractColors', {
        prompt,
      });
      return response.data;
    }

    throw error.response?.data?.error || error;
  }
}

export {
  loginUser,
  generateOpenAiText,
  generateBardText,
  extractSiteInfo,
  extractColors,
  generateImage,
};
