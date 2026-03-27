require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Car = require('../models/car.Model');
const Part = require('../models/part.Model');
const {
  normalizeManufacturer,
  normalizeModel,
} = require('../utils/normalization');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('✅ تم الاتصال بقاعدة البيانات');

    const cars = await Car.find();
    console.log(`🚗 عدد السيارات: ${cars.length}`);

    for (const car of cars) {
      car.manufacturerNormalized = normalizeManufacturer(car.manufacturer);
      car.modelNormalized = normalizeModel(car.model);
      await car.save();
    }

    const parts = await Part.find();
    console.log(`🔩 عدد القطع: ${parts.length}`);

    for (const part of parts) {
      part.manufacturerNormalized = normalizeManufacturer(part.manufacturer);
      part.modelNormalized = normalizeModel(part.model);
      await part.save();
    }

    console.log('✅ تم تحديث البيانات القديمة بنجاح');
    process.exit(0);
  } catch (err) {
    console.error('❌ فشل السكريبت:', err);
    process.exit(1);
  }
}

run();
