const mongoose = require('mongoose');

const spicificorderschema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'يجب إدخال اسم القطعة'],
      trim: true,
      maxlength: [100, 'اسم القطعة لا يمكن أن يتجاوز 100 حرف'],
    },
    serialNumber: {
      type: String,
    },
    manufacturer: {
      type: String,
      required: [true, 'يجب إدخال اسم الصانع'],
    },
    model: {
      type: String,
      required: [true, 'يجب إدخال اسم الطراز أو السلسلة'],
      trim: true,
      maxlength: [50, 'اسم الطراز لا يمكن أن يتجاوز 50 حرف'],
    },
    year: {
      type: Number,
      min: [2000, 'سنة الصنع يجب أن تكون 2000 أو أحدث'],
      max: [
        new Date().getFullYear(),
        `سنة الصنع يجب أن تكون ${new Date().getFullYear()} أو أقدم`,
      ],
      required: [true, 'يجب إدخال سنة الصنع'],
    },
    status: {
      type: String,
      enum: [
        'بانتظار تأكيدك',
        'قيد البحث',
        'قيد المعالجة',
        'ملغي',
        'على الطريق',
        'تم التوصيل',
        'مؤكد',
      ],
      default: 'قيد البحث',
    },
    price: {
      type: Number,
      default: 0,
    },
    count: {
      type: Number,
      default: '1',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'الوصف لا يمكن أن يتجاوز 500 حرف'],
    },
    imageUrls: [
      {
        type: String,
        validate: {
          validator: function (v) {
            return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(
              v
            );
          },
          message: (props) => `${props.value} ليس رابط صحيح للصورة!`,
        },
      },
    ],

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'يجب ربط القطعة بمعرف المستخدم'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

spicificorderschema.index({ manufacturer: 1 });
spicificorderschema.index({ model: 1 });
spicificorderschema.index({ status: 1 });
spicificorderschema.index({ user: 1 });

module.exports = mongoose.model('spicificorderschema', spicificorderschema);
