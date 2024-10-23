import axios from 'axios';
// Middleware to log outgoing requests
export const logOutgoingRequests = (req, res, next) => {
  // Intercept Axios requests
  axios.interceptors.request.use((config) => {
    console.log('Outgoing request:', config.method.toUpperCase(), config.url);
    return config;
  });
  next();
};
