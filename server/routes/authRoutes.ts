import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate, authRateLimiter } from '../middleware/auth.js';

export const authRouter = Router();

// Login with rate limiting (Step 1: credentials -> dispatch OTP, Step 2: verify OTP -> issue token)
authRouter.post('/login', authRateLimiter(6, 15 * 60 * 1000), AuthController.login);
authRouter.post('/login-verify-otp', authRateLimiter(10, 15 * 60 * 1000), AuthController.verifyLoginOtp);
authRouter.post('/verify-login-otp', authRateLimiter(10, 15 * 60 * 1000), AuthController.verifyLoginOtp);

// Session check & profile update
authRouter.get('/me', authenticate, AuthController.getMe);
authRouter.put('/profile', authenticate, AuthController.updateProfile);

// Logout
authRouter.post('/logout', authenticate, AuthController.logout);

// Password recovery & OTP
authRouter.post('/forgot-password', authRateLimiter(5, 15 * 60 * 1000), AuthController.forgotPassword);
authRouter.post('/verify-otp', authRateLimiter(10, 15 * 60 * 1000), AuthController.verifyOtp);
authRouter.post('/reset-password', authRateLimiter(5, 15 * 60 * 1000), AuthController.resetPassword);

// Password update (authenticated)
authRouter.post('/change-password', authenticate, AuthController.changePassword);

// Email verification
authRouter.get('/verify-link', AuthController.verifyLinkOneClick);
authRouter.get('/verify-email', AuthController.verifyLinkOneClick);
authRouter.post('/verify-email', AuthController.verifyEmail);
authRouter.post('/resend-verification', authRateLimiter(5, 15 * 60 * 1000), AuthController.resendVerification);

// NextAuth verification for Next.js website
authRouter.post('/nextauth/verify-credentials', AuthController.nextAuthVerify);
