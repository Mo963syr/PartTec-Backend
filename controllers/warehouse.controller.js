const mongoose = require('mongoose');
const Warehouse = require('../models/warehouse.model');
const Part = require('../models/part.Model');

exports.createWarehouse = async (req, res) => {
  try {
    const { name, address, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'يجب إدخال اسم المستودع',
      });
    }

    const warehouse = await Warehouse.create({
      name: name.trim(),
      address: address?.trim(),
      description: description?.trim(),
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المستودع بنجاح',
      warehouse,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'اسم المستودع موجود مسبقاً',
      });
    }

    res.status(500).json({
      success: false,
      message: 'فشل في إنشاء المستودع',
      error: error.message,
    });
  }
};

exports.getWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find().sort({ name: 1 });

    res.json({
      success: true,
      warehouses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب المستودعات',
      error: error.message,
    });
  }
};

exports.getWarehouseById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستودع غير صالح',
      });
    }

    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'المستودع غير موجود',
      });
    }

    res.json({ success: true, warehouse });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب المستودع',
      error: error.message,
    });
  }
};

exports.updateWarehouse = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستودع غير صالح',
      });
    }

    const { name, address, description } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (address !== undefined) updates.address = address.trim();
    if (description !== undefined) updates.description = description.trim();

    const warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true },
    );

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'المستودع غير موجود',
      });
    }

    res.json({
      success: true,
      message: 'تم تعديل المستودع بنجاح',
      warehouse,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'اسم المستودع موجود مسبقاً',
      });
    }

    res.status(500).json({
      success: false,
      message: 'فشل في تعديل المستودع',
      error: error.message,
    });
  }
};

exports.deleteWarehouse = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستودع غير صالح',
      });
    }

    const partsCount = await Part.countDocuments({ warehouse: req.params.id });
    if (partsCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'لا يمكن حذف المستودع لوجود قطع مرتبطة به',
        partsCount,
      });
    }

    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'المستودع غير موجود',
      });
    }

    res.json({
      success: true,
      message: 'تم حذف المستودع بنجاح',
      warehouse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في حذف المستودع',
      error: error.message,
    });
  }
};
