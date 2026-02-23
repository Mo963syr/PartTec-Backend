// seed.js
const CarBrand = require('../models/CarBrand');

async function seedData() {
  await CarBrand.deleteMany(); // يمسح البيانات القديمة
  await CarBrand.insertMany([
    {
      name: 'تويوتا',
      code: 'Toyota',
      models: [
        'كورولا',
        'كامري',
        'يارس',
        'راف فور',
        'لاند كروزر',
        'برادو',
        'هايلكس',
      ],
    },
    {
      name: 'هيونداي',
      code: 'hyundai',
      models: ['النترا', 'سوناتا', 'توسان', 'سانتافي', 'اكسنت', 'كريتا'],
    },
    {
      name: 'كيا',
      code: 'kia',
      models: ['سيراتو', 'سبورتاج', 'سورينتو', 'بيكانتو', 'ك5'],
    },
    {
      name: 'نيسان',
      code: 'Nissan',
      models: ['صني', 'التيما', 'باترول', 'اكستريل', 'قشقاي'],
    },
    {
      name: 'بي إم دبليو',
      code: 'BMW',
      models: ['الفئة الثالثة', 'الفئة الخامسة', 'X3', 'X5'],
    },
    {
      name: 'ميتسوبيشي',
      code: 'mitsubishi',
      models: ['لانسر', ' اوت لاندر', '', ''],
    },
  ]);
  console.log('✅ Seeding done');
}

// هنا التصدير الصحيح
module.exports = seedData;
