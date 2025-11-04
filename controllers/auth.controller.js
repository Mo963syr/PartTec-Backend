const User = require('../models/user.model');
const bcrypt = require('bcrypt');
exports.register = async (req, res) => {
  const {
    name,
    companyName,
    phoneNumber,
    email,
    password,
    role,
    prands,
    province,
  } = req.body;

  try {
    // تحقق من وجود الإيميل مسبقاً
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already in use' });
    }

    if (!email) {
      return res.status(400).json({ message: 'Email is not valid' });
    }

    // تحقق من الشروط حسب الدور
    if (role === 'seller') {
      if (!companyName || companyName.trim() === '') {
        return res
          .status(400)
          .json({ message: 'companyName is required for sellers' });
      }
      if (!prands || !Array.isArray(prands) || prands.length === 0) {
        return res
          .status(400)
          .json({ message: 'prands array is required for sellers' });
      }
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // إنشاء المستخدم الجديد
    const user = new User({
      name,
      companyName: role === 'seller' ? companyName : undefined,
      phoneNumber,
      email,
      password: hashedPassword,
      role,
      province,
      prands: role === 'seller' ? prands : [],
    });

    await user.save();

    // تجهيز الرد بدون الباسورد
    const userResponse = {
      _id: user._id,
      name: user.name,
      companyName: user.companyName,
      phoneNumber: user.phoneNumber,
      email: user.email,
      role: user.role,
      province: province,
      prands: user.prands,
    };

    return res.status(201).json({
      message: 'User created successfully',
      user: userResponse,
      userId: user._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred during sign up' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const response = {
      message: 'Sign in successful',

      userId: user._id,

      role: user.role,
    };

    if (user.role === '') {
      response.status = ' dashboard';
    } else if (user.role === 'user') {
      response.status = 'user dashboard';
    } else if (user.role === 'coordinator') {
      response.status = 'coordinator dashboard';
    } else if (user.role === 'delevery') {
      response.status = 'delevery dashboard';
    } else if (user.role === 'mechanic') {
      response.status = 'mechanic dashboard';
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
