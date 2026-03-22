const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyOtp, forgotPassword, resetPassword, submitVerification, approveRider, getVerificationStatus } = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOtp);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword', resetPassword);
router.post('/:id/submit-verification', submitVerification);
router.patch('/:id/approve-rider', approveRider);
router.get('/:id/verification-status', getVerificationStatus);

module.exports = router;