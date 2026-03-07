const mongoose = require('mongoose');
const DeletedUser = require('./DeletedUser');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'يجب إدخال الاسم'],
  },
  companyName: String,
  email: {
    type: String,
    required: [true, 'يجب إدخال البريد الإلكتروني'],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'يجب إدخال كلمة المرور'],
  },
  phoneNumber: {
    type: String,
    required: [true, 'يجب إدخال رقم الموبايل'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  cars: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Car',
    },
  ],
  prands: {
    type: [String],
    default: [],
  },
  role: {
    type: String,
    enum: ['user', 'seller', 'worker', 'delivery', 'mechanic'],
    default: 'user',
  },
  province: {
    type: String,
    default: 'دمشق',
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: [Number],
  },
  provinceNorm: {
    type: String,
    default: '',
  },
});
userSchema.pre('findOneAndDelete', async function (next) {
  try {
    const user = await this.model.findOne(this.getFilter());

    if (user) {
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
        role: user.role === "delevery" ? "delivery" : user.role,
        province: user.province,
        location: user.location,
        provinceNorm: user.provinceNorm,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
});
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
