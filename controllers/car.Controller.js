// const mongoose = require('mongoose');

const Car = require('../models/car.Model');
const User = require('../models/user.model');
exports.addCar = async (req, res) => {
  const { manufacturer, model, year, fuelType, user } = req.body;

  try {
    const newCar = new Car({ manufacturer, model, year, serialNumber, user });
    await newCar.save();
    res.status(201).json({ message: '🚗 تم إضافة السيارة بنجاح', car: newCar });
  } catch (error) {
    res.status(400).json({ error: '❌ حدث خطأ أثناء إضافة السيارة' });
  }
};

exports.viewcar = async (req, res) => {
  const { userId } = req.params;

  try {
    const cars = await Car.find({ user: userId });
    res.status(200).json(cars);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '❌ فشل في جلب السيارات' });
  }
};

exports.addCarToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { manufacturer, model, year, serialNumber } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستخدم مطلوب',
      });
    }

    if (!manufacturer || !model || !year || !serialNumber) {
      return res.status(400).json({
        success: false,
        message: 'يجب إدخال الشركة والموديل والسنة ورقم الشاص',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود',
      });
    }

    const car = await Car.create({
      manufacturer: manufacturer.trim(),
      model: model.trim(),
      year: parseInt(year, 10),
      serialNumber: serialNumber.trim().toUpperCase(),
      user: userId,
    });

    user.cars.push(car._id);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'تمت إضافة السيارة بنجاح',
      car,
    });
  } catch (err) {
    console.error('❌ خطأ أثناء إضافة السيارة:', err);

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'رقم الشاص مستخدم مسبقًا',
      });
    }

    res.status(500).json({
      success: false,
      message: 'فشل في إضافة السيارة',
      error: err.message,
    });
  }
};
