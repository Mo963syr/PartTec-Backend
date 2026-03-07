const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const DeletedUser = require('../models/DeletedUser');
exports.updateUserLocation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { lng, lat } = req.body;

    if (!userId || lng === undefined || lat === undefined) {
      return res.status(400).json({
        success: false,
        message: '⚠️ يجب إرسال userId و lng و lat',
      });
    }

    if (typeof lng !== 'number' || typeof lat !== 'number') {
      return res.status(400).json({
        success: false,
        message: '⚠️ يجب أن تكون الإحداثيات أرقام',
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          location: {
            type: 'Point',
            coordinates: [lng, lat],
          },
        },
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '❌ المستخدم غير موجود',
      });
    }

    res.status(200).json({
      success: true,
      message: '✅ تم تحديث الموقع بنجاح',
      user,
    });
  } catch (err) {
    console.error('❌ خطأ في تحديث الموقع:', err);
    res.status(500).json({
      success: false,
      message: '❌ فشل في تحديث الموقع',
      error: err.message,
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('_id');

    const user_id = users.map((u) => u._id);

    res.status(200).json({
      success: true,
      count: user_id.length,
      user_id,
    });
  } catch (err) {
    console.error('❌ خطأ عند جلب المستخدمين:', err);
    res.status(500).json({
      success: false,
      message: 'فشل جلب المستخدمين',
    });
  }
};

exports.getUserData = async (req, res) => {
  try {
    const userData = await User.find({
      role: 'user',
      _id: req.params.userId,
    }).select('name email phoneNumber province');

    // const user_id = users.map((u) => u._id);

    res.status(200).json({
      success: true,
      userData: userData,
    });
  } catch (err) {
    console.error('❌ خطأ عند جلب المستخدمين:', err);
    res.status(500).json({
      success: false,
      message: 'فشل جلب المستخدمين',
    });
  }
};
// ✅ Controller: edit/update user data
// PUT /parttec/user/:userId   (مثال)
// Body: { name?, email?, phoneNumber?, province? }

exports.updateUserData = async (req, res) => {
  try {
    const { userId } = req.params;

    const allowed = ['name', 'email', 'phoneNumber', 'province'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لا يوجد أي بيانات لتحديثها',
      });
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, role: 'user' },
      { $set: updates },
      { new: true, runValidators: true },
    ).select('name email phoneNumber province role');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود',
      });
    }

    return res.status(200).json({
      success: true,
      message: '✅ تم تحديث بيانات المستخدم بنجاح',
      user,
    });
  } catch (err) {
    console.error('❌ خطأ عند تحديث بيانات المستخدم:', err);
    return res.status(500).json({
      success: false,
      message: 'فشل تحديث بيانات المستخدم',
    });
  }
};
exports.addUser = async (req, res) => {
  try {
    const { name, email, password, phoneNumber, prands, companyName, role } =
      req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      companyName,
      password: hashedPassword,
      phoneNumber,
      prands,
      role,
    });

    res.status(201).json({
      message: '✅ Account created successfully',
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.putprands = async (req, res) => {
  try {
    let { prand } = req.body;
    const { userId } = req.params;

    if (typeof prand === 'string') {
      prand = prand.toLowerCase();
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { prands: prand } },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: '❌ User not found' });
    }

    res.status(200).json({
      message: '✅ prand added successfully',
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.viewsellerprands = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('prands');

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.status(200).json({
      message: 'success',
      prands: user.prands,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllUsersforAdmin = async (req, res) => {
  try {
    const users = await User.find().select('name role phoneNumber email');
    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '❌ فشل في جلب المستخدمين',
      error: err.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '🚫 المستخدم غير موجود',
      });
    }

    await DeletedUser.create({
      originalUserId: user._id,
      name: user.name,
      companyName: user.companyName,
      email: user.email,
      password: user.password,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
      cars: user.cars,
      prands: user.prands,
      role: user.role,
      province: user.province,
      location: user.location,
      provinceNorm: user.provinceNorm,
    });

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: '✅ تم حذف المستخدم بنجاح',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '❌ فشل في حذف المستخدم',
      error: err.message,
    });
  }
};
