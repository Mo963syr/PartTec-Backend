const SpicificOrder = require('../models/spicificPartOrder.model');
const part = require('../models/part.Model');
const User = require('../models/user.model');
const Order = require('../models/order.model');
const cloudinary = require('../utils/cloudinary');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { count } = require('console');

const express = require('express');
const axios = require('axios');

exports.getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: '⚠️ معرف المستخدم غير صالح',
      });
    }

    const response = await axios.post(
      'https://reccomendation-system-06l7.onrender.com/recommend',
      { user_id: userId, top_n: 10 },

      { headers: { 'Content-Type': 'application/json' } }
    );

    const recommendations = response.data.recommendations || [];

    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'لا توجد توصيات حالياً',
        recommendations: [],
      });
    }

    const parts = await part
      .find({
        _id: { $in: recommendations },
      })
      .select('name manufacturer model year price imageUrl');

    return res.status(200).json({
      success: true,
      userId,
      recommendations: parts,
    });
  } catch (err) {
    console.error('❌ خطأ أثناء جلب التوصيات:', err.message);
    return res.status(500).json({
      success: false,
      message: '❌ فشل في جلب التوصيات',
      error: err.message,
    });
  }
};

exports.getPartsbyId = async (req, res) => {
  try {
    const { partId } = req.body;
    const parts = await part
      .find({ _id: partId })
      .select('_id name manufacturer year')
      .lean();

    res.status(200).json({
      success: true,

      parts: parts,
    });
  } catch (err) {
    console.error('❌ خطأ عند جلب القطع:', err);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب القطع',
    });
  }
};
exports.getAllParts = async (req, res) => {
  try {
    const parts = await part.find().select('_id name manufacturer year').lean();

    const formattedParts = parts.map((p) => ({
      item_id: p._id,
      part_name: p.name,
      manufacturer: p.manufacturer,
      year: p.year,
    }));

    res.status(200).json({
      success: true,
      count: formattedParts.length,
      parts: formattedParts,
    });
  } catch (err) {
    console.error('❌ خطأ عند جلب القطع:', err);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب القطع',
    });
  }
};

exports.addPartsFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '⚠️ لم يتم رفع أي ملف' });
    }

    const { user } = req.body;
    if (!user) {
      return res
        .status(400)
        .json({ message: '⚠️ يجب إرسال معرف المستخدم مع الطلب' });
    }

    const fixedImageUrl =
      'https://res.cloudinary.com/dzjrgcxwt/image/upload/photo_2025-09-02_07-58-51_e8g6im.jpg';

    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const insertedParts = [];

    for (const row of rows) {
      const newPart = new part({
        name: row.name,
        manufacturer: row.manufacturer ? row.manufacturer.toLowerCase() : null,
        model: row.model ? row.model.toLowerCase() : null,
        year: row.year,
        category: row.category,
        status: row.status,
        user: user,
        price: row.price,
        count: row.count,
        serialNumber: row.serialNumber,
        description: row.description,
        imageUrl: fixedImageUrl,
      });

      await newPart.save();
      insertedParts.push(newPart);
    }

    fs.unlinkSync(req.file.path);

    res.status(201).json({
      message: `✅ تم إضافة ${insertedParts.length} قطعة`,
      parts: insertedParts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '❌ فشل في إضافة القطع' });
  }
};

exports.getPartRatings = async (req, res) => {
  try {
    const { partId } = req.params;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || '10', 10), 1),
      100
    );
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(partId)) {
      return res
        .status(400)
        .json({ success: false, message: 'معرّف غير صالح' });
    }

    const partDoc = await part
      .findById(partId, { ratings: 1, avgRating: 1, ratingsCount: 1 })
      .populate({
        path: 'ratings.user',
        select: 'name email role',
        options: { lean: true },
      })
      .lean();

    if (!partDoc) {
      return res
        .status(404)
        .json({ success: false, message: 'القطعة غير موجودة' });
    }

    // حوّل أي قيمة إلى مصفوفة آمنة
    const raw = partDoc.ratings ?? [];
    const ratings = Array.isArray(raw)
      ? raw
      : raw && typeof raw === 'object'
      ? Object.values(raw)
      : [];

    // لو ما في تقييمات، رجّع صفر بدون أخطاء
    if (!ratings.length) {
      return res.status(200).json({
        success: true,
        data: {
          partId,
          avgRating: Number(partDoc.avgRating || 0),
          ratingsCount: Number(partDoc.ratingsCount || 0),
          breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          page,
          limit,
          items: [],
        },
      });
    }

    // إحصائيات
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of ratings) {
      const v = Number(r?.rating ?? 0);
      if (v >= 1 && v <= 5) counts[v] += 1;
    }
    const total = ratings.length;
    const sum = ratings.reduce((a, r) => a + Number(r?.rating ?? 0), 0);
    const avg = Number((sum / total).toFixed(2));

    // ترقيم صفحات + ترتيب زمني
    const items = ratings
      .slice()
      .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
      .slice(skip, skip + limit)
      .map((r) => ({
        userId: r?.user?._id ?? r?.user ?? null,
        userName: r?.user?.name ?? 'مستخدم',
        rating: Number(r?.rating ?? 0),
        createdAt: r?.createdAt ?? null,
      }));

    return res.status(200).json({
      success: true,
      data: {
        partId,
        avgRating: Number(partDoc.avgRating ?? avg),
        ratingsCount: Number(partDoc.ratingsCount ?? total),
        breakdown: counts,
        page,
        limit,
        items,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.ratePart = async (req, res) => {
  try {
    const { partId } = req.params;
    const { userId } = req.body;
    const rating = Number(req.body.rating);

    if (
      !mongoose.Types.ObjectId.isValid(partId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ success: false, message: 'معرف غير صالح' });
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: '⚠️ التقييم يجب أن يكون بين 1 و 5' });
    }

    const order = await Order.findOne({
      userId,
      status: 'تم التوصيل',
    }).populate({
      path: 'cartIds',
      select: 'partId',
      match: { partId: new mongoose.Types.ObjectId(partId) },
    });
    console.log(order);
    if (!order) {
      return res.status(403).json({
        success: false,
        message: 'لا يمكنك تقييم هذه القطعة قبل استلامها',
      });
    }

    const partDoc = await part.findById(partId);
    if (!partDoc) {
      return res
        .status(404)
        .json({ success: false, message: 'القطعة غير موجودة' });
    }

    const already = (partDoc.ratings || []).some(
      (r) => r.user.toString() === userId
    );
    if (already) {
      return res
        .status(400)
        .json({ success: false, message: 'لقد قمت بتقييم هذه القطعة سابقًا' });
    }

    const ratings = [...(partDoc.ratings || []), { user: userId, rating }];
    const sum = ratings.reduce((a, r) => a + Number(r.rating || 0), 0);
    const avgRating = Number((sum / ratings.length).toFixed(2));
    const ratingsCount = ratings.length;

    await part.updateOne(
      { _id: partId },
      {
        $push: { ratings: { user: userId, rating } },
        $set: { avgRating, ratingsCount },
      }
    );

    return res.status(200).json({
      success: true,
      message: '✅ تم حفظ التقييم بنجاح',
      data: { avgRating, ratingsCount },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.deletePart = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await part.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: '❌ القطعة غير موجودة' });
    }

    res.json({ message: '✅ تم حذف القطعة', part: deleted });
  } catch (err) {
    console.error('خطأ أثناء الحذف:', err);
    res.status(500).json({ message: '⚠️ خطأ في السيرفر' });
  }
};

exports.updatePart = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await part.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return res.status(404).json({ message: '❌ القطعة غير موجودة' });
    }

    res.json({ message: '✅ تم تعديل القطعة', part: updated });
  } catch (err) {
    console.error('خطأ أثناء التعديل:', err);
    res.status(500).json({ message: '⚠️ خطأ في السيرفر' });
  }
};

exports.deletePart = async (req, res) => {
  try {
    const { partId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(partId) || !partId) {
      return res.status(400).json({ error: '❌ معرف القطعة غير صالح' });
    }
    const deletedPart = await part.findByIdAndDelete(partId);

    if (!deletedPart) {
      return res.status(404).json({ error: '❌ لم يتم العثور على القطعة' });
    }

    res.status(200).json({
      message: '✅ تم حذف القطعة بنجاح',
      deletedPart: deletedPart,
    });
  } catch (error) {
    console.error('❌ خطأ أثناء حذف القطعة:', error);
    res.status(500).json({ error: 'فشل في حذف القطعة بسبب خطأ داخلي' });
  }
};

exports.getCompatibleParts = async (req, res) => {
  try {
    const { userid } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userid)) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستخدم غير صالح',
      });
    }

    const user = await User.findById(userid)
      .select('cars')
      .populate('cars', 'manufacturer model year');

    if (!user || !user.cars || user.cars.length === 0) {
      const part = await part.find();
      return res.status(200).json({
        success: true,
        parts: part,
        message: 'تم ارجاع كل السيارات',
      });
    }

    const compatibleParts = await part
      .find({
        count: { $gt: 0 }, //
        $or: user.cars.map((car) => ({
          manufacturer: car.manufacturer,
          model: car.model,
        })),
      })
      .select(
        'name manufacturer serialNumber model year category status price imageUrl count'
      )
      .sort({ price: 1 });

    res.status(200).json({
      success: true,
      userCars: user.cars,
      compatibleParts: compatibleParts.map((part) => ({
        id: part._id,
        name: part.name,
        manufacturer: part.manufacturer,
        serialNumber: part.serialNumber,
        model: part.model,
        year: part.year,
        category: part.category,
        status: part.status,
        count: part.count,
        price: part.price,
        imageUrl: part.imageUrl || '/default-part-image.jpg',
      })),
      meta: {
        totalParts: compatibleParts.length,
      },
    });
  } catch (error) {
    console.error('حدث خطأ في جلب القطع المتوافقة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
exports.getallOrdersForSeller = async (req, res) => {
  try {
    const { userid } = req.params;
    const { manufacturer, status }=req.query
    // 1️⃣ التحقق من صحة ObjectId
    if (!mongoose.Types.ObjectId.isValid(userid)) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستخدم غير صالح',
      });
    }

    // 2️⃣ التأكد أن المستخدم بائع
    const user = await User.findById(userid).select('role');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود',
      });
    }

    if (user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        message: 'هذه العملية متاحة للبائعين فقط',
      });
    }

    // 3️⃣ بناء الفلتر الديناميكي
    const filter = {};

    // فلترة manufacturer
    if (manufacturer && manufacturer !== 'all') {
      filter.manufacturer = manufacturer;
    }

    // فلترة status
    const allowedStatuses = [
      'قيد البحث',
      'قيد المعالجة',
      'ملغي',
      'على الطريق',
      'تم التوصيل',
      'مؤكد',
    ];

    if (status && status !== 'all') {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'حالة الطلب غير صالحة',
        });
      }

      filter.status = status;
    }

    // 4️⃣ تنفيذ الاستعلام
    const orders = await SpicificOrder.find(filter)
      .select(
        'name serialNumber manufacturer model year status price imageUrls notes user count'
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      filters: {
        manufacturer: manufacturer || 'all',
        status: status || 'all',
      },
      totalOrders: orders.length,
      orders: orders.map((order) => ({
        id: order._id,
        name: order.name,
        serialNumber: order.serialNumber,
        manufacturer: order.manufacturer,
        model: order.model,
        year: order.year,
        count: order.count,
        status: order.status,
        price: order.price,
        notes: order.notes,
        imageUrls: order.imageUrls?.length
          ? order.imageUrls
          : ['/default-part-image.jpg'],
      })),
    });
  } catch (error) {
    console.error('خطأ في جلب الطلبات:', error);

    return res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : undefined,
    });
  }
};




// تجلب الطلبات اليدوية لللقطع حسب الصلاحية اذا كان مقدم الطلب المستخدم او بائع
exports.CompatibleSpicificOrders = async (req, res) => {
  try {
    //الرول هنا حسب مقدم الطلب الخاص
    const { userid, role: targetRole } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userid)) {
      return res
        .status(400)
        .json({ success: false, message: 'معرف المستخدم غير صالح' });
    }

    const user = await User.findById(userid).select('prands role');
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'المستخدم غير موجود' });
    }

    const hasPrands = Array.isArray(user.prands) && user.prands.length > 0;
    const manufacturerFilter = hasPrands
      ? { manufacturer: { $in: user.prands } }
      : {};

    const raw = await SpicificOrder.find(manufacturerFilter)
      .select(
        'name serialNumber manufacturer model year status price imageUrls notes user'
      )
      .populate({
        path: 'user',
        match: targetRole ? { role: targetRole } : {},
        select: 'role name',
      })
      .sort({ price: 1 })
      .lean();

    // صفّي الذي لم يطابق الدور (user=null بعد populate)
    const compatibleParts = raw.filter((o) => !!o.user);

    return res.status(200).json({
      success: true,
      userprands: user.prands ?? [],
      compatibleParts: compatibleParts.map((order) => ({
        id: order._id,
        name: order.name,
        serialNumber: order.serialNumber,
        manufacturer: order.manufacturer,
        model: order.model,
        count: order.count,
        year: order.year,
        notes: order.notes,
        status: order.status,
        price: order.price,

        requesterRole: order.user?.role,
        imageUrls: order.imageUrls || '/default-part-image.jpg',
      })),
      meta: {
        totalorders: compatibleParts.length,
        filteredByRole: !!targetRole,
        filteredByPrands: hasPrands,
      },
    });
  } catch (error) {
    console.error('حدث خطأ في جلب الطلبات المتوافقة:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.viewPrivateParts = async (req, res) => {
  try {
    const { userid, category } = req.body;

    let parts;

    if (!userid || userid.trim() === '') {
      parts = await part.find();
    } else if (userid != null) {
      parts = await part.find({ user: userid });
    } else if (category) {
      parts = await part.find({ category: category });
    }

    res.status(200).json({
      message: '✅ تم جلب القطع بنجاح',
      parts: parts,
    });
  } catch (error) {
    console.error('❌ خطأ أثناء جلب القطع:', error);
    res.status(500).json({ error: 'فشل في جلب القطع' });
  }
};
exports.viewAllParts = async (req, res) => {
  try {
    let parts;
    parts = await part.find({ count: { $gt: 0 } });

    res.status(200).json({
      message: '✅ تم جلب القطع بنجاح',
      compatibleParts: parts,
    });
  } catch (error) {
    console.error('❌ خطأ أثناء جلب القطع:', error);
    res.status(500).json({ error: 'فشل في جلب القطع' });
  }
};
exports.viewsellerParts = async (req, res) => {
  try {
    const { userId } = req.params;

    const parts = await part.find({ user: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      parts,
    });
  } catch (error) {
    console.error('❌ خطأ أثناء جلب القطع:', error);
    res.status(500).json({ error: 'فشل في جلب القطع' });
  }
};

exports.addPart = async (req, res) => {
  try {
    const {
      name,
      manufacturer,
      model,
      year,
      category,
      status,
      count,
      price,
      serialNumber,
      description,
      user,
    } = req.body;

    const userId = req.user?._id || user;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '🚫 يجب تحديد معرف المستخدم',
      });
    }

    let imageUrl = null;
    if (req.file) {
      console.log(' File received:', req.file.path);
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    }
    const newPart = new part({
      name,
      manufacturer: manufacturer ? manufacturer.toLowerCase() : null,
      serialNumber,
      model: model ? model.toLowerCase() : null,
      year,
      count,
      category,
      status,
      user: userId,
      imageUrl,
      price,
      description,
    });

    await newPart.save();

    res.status(201).json({
      success: true,
      message: '✅ تم إضافة المنتج',
      part: newPart,
    });
  } catch (error) {
    console.error('❌ خطأ أثناء إضافة المنتج:', error);
    res.status(500).json({ error: '❌ فشل في إضافة المنتج' });
  }
};

exports.addspicificorder = async (req, res) => {
  try {
    const {
      name,
      manufacturer,
      model,
      year,
      serialNumber,
      notes,
      user,
      count,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(user)) {
      return res.status(400).json({
        success: false,
        message: '⚠️ معرف المستخدم غير صالح',
      });
    }

    const userExists = await User.findById(user);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: '🚫 المستخدم غير موجود في قاعدة البيانات',
      });
    }

    let imageUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    }
    const newOrder = new SpicificOrder({
      name,
      manufacturer: manufacturer.toLowerCase(),
      model: model.toLowerCase(),
      year,
      serialNumber,
      notes,
      count,
      user,
      imageUrls: imageUrl ? [imageUrl] : [],
    });

    await newOrder.save();

    res.status(201).json({
      success: true,
      message: '✅ تم إضافة الطلب',
      part: newOrder,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: '❌ فشل في إضافة الطلب' });
  }
};
