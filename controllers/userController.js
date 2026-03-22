const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // 1. Check if the user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'A user with this email already exists!' });
    }

    // 2. Scramble (Hash) the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create the new user object
    user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || 'customer'
    });

    // --- NEW OTP LOGIC ---
    // Generate a random 4-digit number
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // Attach the OTP to the user before saving (expires in 10 mins)
    user.otp = generatedOtp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;

    // Save the user (with the OTP attached) to MongoDB
    await user.save();

    // Send the email!
    const message = `Welcome to Seedha Order! \n\nYour verification code is: ${generatedOtp} \n\nThis code will expire in 10 minutes.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Seedha Order - Your OTP Code',
        message: message,
      });
      console.log(`✅ OTP Email sent to ${user.email}`);
    } catch (emailError) {
      console.error('❌ Email failed to send:', emailError);
      // We still let the registration succeed, but log the error
    }
    // --- END OTP LOGIC ---

    // 4. Send a success message back to the frontend
    res.status(201).json({
      message: 'User created successfully! Please check your email for the OTP.',
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error during registration' });
  }
};


// --- NEW FUNCTION: VERIFY OTP ---
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if OTP matches and is not expired
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired. Please register again.' });
    }

    // Success! Mark user as verified and delete the OTP from the database
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Account successfully verified!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error during verification' });
  }
};


// Login an existing user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find the user in the database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // 🚨 THE GATEKEEPER: Stop them if they haven't verified!
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email with the OTP sent to you before logging in.', requiresVerification: true });
    }

    // 2. Check if the password matches the scrambled password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // 3. Generate the Digital ID Card (JWT Token)
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' } // Token lasts for 30 days
    );

    // 4. Send the token and user data back to the app
    res.status(200).json({
      message: 'Login successful!',
      token: token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error during login' });
  }
};

// --- NEW FUNCTION: FORGOT PASSWORD ---
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'There is no user with that email' });
    }

    // 2. Generate Reset OTP (6-digits)
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Save OTP to DB (We'll save it unhashed for simplicity as it's just a short lived code, 
    // but you could hash it just like the long token if you prefer maximum security)
    user.resetPasswordToken = resetOtp;

    // Set expire time to 15 minutes
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    // 4. Send Email
    const message = `You requested a password reset. \n\nPlease use the following 6-digit OTP code to reset your password:\n\n✨ ${resetOtp} ✨\n\nThis code will expire in 15 minutes.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Seedha Order - Password Reset OTP',
        message: message
      });
      res.status(200).json({ message: 'OTP Email sent' });
    } catch (err) {
      console.error(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: 'Email could not be sent' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error during password reset request' });
  }
};

// --- NEW FUNCTION: RESET PASSWORD ---
const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ message: 'Please provide email, OTP, and a new password' });
    }

    // 1. Find User by email, check OTP, and check if it's expired
    const user = await User.findOne({
      email: email.trim(),
      resetPasswordToken: otp.trim(), // We re-purposed resetPasswordToken to store the short OTP
      resetPasswordExpire: { $gt: Date.now() } // Expiration must be greater than current time
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid OTP or OTP has expired' });
    }

    // 2. Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 3. Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: 'Password has been successfully reset. You can now login.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error during password reset' });
  }
};

// Submit rider verification documents
const submitVerification = async (req, res) => {
  try {
    const { idImageUrl, vehicleImageUrl } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.verificationStatus = 'pending';
    user.verificationIdImageUrl = idImageUrl;
    user.verificationVehicleImageUrl = vehicleImageUrl;
    await user.save();

    res.status(200).json({ message: 'Verification submitted', verificationStatus: user.verificationStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Admin: approve or reject a rider
const approveRider = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: `Rider ${status}`, verificationStatus: user.verificationStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get rider verification status
const getVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('verificationStatus subscriptionStatus subscriptionExpiry');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ 
      verificationStatus: user.verificationStatus,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiry: user.subscriptionExpiry
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { registerUser, loginUser, verifyOtp, forgotPassword, resetPassword, submitVerification, approveRider, getVerificationStatus };