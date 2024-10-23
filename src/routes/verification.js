import { Router } from 'express';
import {
  forgotPassword,
  resetPassword,
  verifyForgotPasswordOtp,
  resetForgotPassword,
} from '../controllers/verification.js';
// import Auth from '../utils/userAuth.js';
const userRoute = Router();

userRoute.post('/forgot-password', forgotPassword);
userRoute.post('/verify-otp', verifyForgotPasswordOtp);
userRoute.post('/reset-forgot-password', resetForgotPassword);
//userRoute.get('/reset-password', Auth, resetPassword);

export default userRoute;
