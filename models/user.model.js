const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'يجب إدخال الاسم'],
  },
  companyName: {
    type: String,
  },
  email: {
    type: String,
    required: [true, 'يجب إدخال البريد الإلكتروني'],
    unique: true,
    lowercase: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'البريد الإلكتروني غير صالح. يرجى إدخال بريد إلكتروني صحيح.',
    ],
  },
  password: {
    type: String,
    required: [true, 'يجب إدخال كلمة المرور'],
    minlength: [6, 'يجب أن تكون كلمة المرور على الأقل 6 أحرف'],
  },
  phoneNumber: {
    type: String,
    required: [true, 'يجب إدخال رقم الموبايل'],
    match: [/^(?:\+963|00963|0)?9\d{8}$/, 'رقم الموبايل السوري غير صالح'],
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
    required: true,
    enum: ['user', 'seller', 'worker', 'delivery', 'mechanic'], // ✅ صححت spelling
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
    coordinates: {
      type: [Number],
      validate: {
        validator: function (val) {
          // إذا فاضي أو غير موجود → اعتبره صحيح
          if (!val || val.length === 0) return true;
          return Array.isArray(val) && val.length === 2;
        },
        message: 'يجب تحديد إحداثيات صحيحة [lng, lat]',
      },
      required: false, 
      default: undefined, 
    },
  },
  provinceNorm: {
    type: String,
    default: '',
  },
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
