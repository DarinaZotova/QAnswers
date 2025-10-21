// backend/routes/auth.routes.js
const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const auth = require('../middlewares/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.me);
router.post('/logout', auth, authController.logout);
router.post('/email/request', authController.requestEmailVerification);
router.get('/email/status', authController.emailStatus);
router.post('/password-reset', authController.passwordResetSend); 
router.post('/password-reset/:confirm_token', authController.passwordResetConfirm); 


module.exports = router;
