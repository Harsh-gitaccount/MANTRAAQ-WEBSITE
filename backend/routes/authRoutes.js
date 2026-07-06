const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerRules, loginRules, forgotPasswordRules, resetPasswordRules, updateProfileRules, changePasswordRules } = require('../middleware/validate');

const router = express.Router();

router.post('/register', registerRules, authController.register);
router.post('/login', loginRules, authController.login);
router.post('/admin-login', loginRules, authController.adminLogin);
router.post('/google', authController.googleAuth);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);
router.put('/update-profile', protect, updateProfileRules, authController.updateProfile);
router.put('/change-password', protect, changePasswordRules, authController.changePassword);
router.post('/forgot-password', forgotPasswordRules, authController.forgotPassword);
router.post('/reset-password', resetPasswordRules, authController.resetPassword);

module.exports = router;
