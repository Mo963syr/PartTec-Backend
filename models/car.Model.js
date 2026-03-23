const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  manufacturer: {
    type: String,
    required: [true, ' يجب إدخال اسم الصانع'],
  },
  model: {
    type: String,
    required: [true, ' يجب إدخال اسم الطراز أو السلسلة'],
  },
  year: {
    type: Number,
    required: [true, ' يجب إدخال سنة الصنع'],
  },
  serialNumber: {
    type: String,
    unique: [true, ' يجب أن يكون رقم الشاص فريدًا'],
    required: [true, ' يجب إدخال رقم الشاص'],
  },
  // fuelType: {
  //   type: String,   
  //   enum: {
  //     values: ['ديزل', 'بترول'],
  //     message: ' نوع الوقود يجب أن يكون إما "ديزل" أو "بترول" فقط',
  //   },
  //   required: [true, ' يجب اختيار نوع الوقود'],
  // },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'يجب ربط السيارة بمعرف المستخدم'],
  },
});

module.exports = mongoose.model('Car', carSchema);
