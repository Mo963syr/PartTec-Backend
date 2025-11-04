const RecommendationOffer = require('../models/RecommendationOffer.model');
const SpicificOrder = require('../models/spicificPartOrder.model');
const OrderSummary = require('../models/orderSummary.model');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const cloudinary = require('../utils/cloudinary');

exports.applyOfferToOrder = async (req, res) => {
  try {
    const { recommendationOfferId, orderId } = req.body;

    const offer = await RecommendationOffer.findById(recommendationOfferId);
    if (!offer)
      return res.status(404).json({ message: 'عرض التوصية غير موجود' });

    const order = await SpicificOrder.findById(orderId);
    if (!order) return res.status(404).json({ message: 'الطلب غير موجود' });

    order.notes = offer.description;
    order.price = offer.price;

    if (offer.imageUrl) {
      order.imageUrls = order.imageUrls || [];
      if (!order.imageUrls.includes(offer.imageUrl)) {
        order.imageUrls.push(offer.imageUrl);
      }
    }

    order.status = 'قيد المعالجة';
    await order.save();

    offer.status = 'غير متاح';
    await offer.save();

    await OrderSummary.create({
      order: order._id,
      offer: offer._id,
      appliedPrice: offer.price,
      appliedDescription: offer.description,
      appliedImages: offer.imageUrl ? [offer.imageUrl] : [],
      status: 'قيد المعالجة',
    });

    res.status(200).json({
      success: true,
      message:
        '✅ تم ربط العرض بالطلب وتحديث الحالات وتخزين نسخة في الجدول الوسيط',
      order,
      offer,
    });
  } catch (err) {
    console.error('❌ خطأ في applyOfferToOrder:', err);
    res.status(500).json({ message: 'خطأ في الخادم', error: err.message });
  }
};

exports.applyOfferToOrde = async (req, res) => {
  try {
    const { recommendationOfferId, orderId } = req.body;

    const offer = await RecommendationOffer.findById(recommendationOfferId);
    if (!offer) {
      return res.status(404).json({ message: 'عرض التوصية غير موجود' });
    }

    const order = await SpicificOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    order.notes = offer.description;
    if (offer.imageUrl) {
      order.imageUrls = order.imageUrls || [];
      if (!order.imageUrls.includes(offer.imageUrl)) {
        order.imageUrls.push(offer.imageUrl);
      }
    }

    order.price = offer.price;

    order.status = 'قيد المعالجة';

    await order.save();

    return res.status(200).json({
      message: 'تم ربط العرض بالطلب وتحديث البيانات بنجاح',
      order,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: 'خطأ في الخادم', error: err.message });
  }
};

exports.createOffer = async (req, res) => {
  try {
    const { orderId, price, description, sellerId } = req.body;

    if (!price) {
      return res
        .status(400)
        .json({ success: false, message: '⚠️ يجب ادخال السعر' });
    }
    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, message: 'يجب ادخال معرف الطلب' });
    }
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: '⚠️ معرف المستخدم غير صالح',
      });
    }

    const userExists = await User.findById(sellerId);
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
    const offer = new RecommendationOffer({
      seller: sellerId,
      order: orderId,
      price,
      imageUrl: imageUrl ? [imageUrl] : [],
      description,
    });

    await offer.save();

    res.status(201).json({
      success: true,
      message: '✅ تم إضافة العرض بنجاح',
      offer,
    });
  } catch (err) {
    console.error('❌ خطأ أثناء إضافة العرض:', err);
    res.status(500).json({
      success: false,
      message: 'فشل في إضافة العرض',
      error: err.message,
    });
  }
};

exports.getOffersByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const offers = await RecommendationOffer.find({
      order: orderId,
      status: 'متاح',
    })
      .populate('seller', 'name phone email')
      .populate('order');

    res.status(200).json({
      success: true,
      total: offers.length,
      offers,
    });
  } catch (err) {
    console.error('❌ خطأ أثناء جلب العروض:', err);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب العروض',
      error: err.message,
    });
  }
};

exports.CartStatusTo = async (req, res) => {
  try {
    const { cartId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['قيد المعالجة', 'مؤكد', 'ملغي', 'على الطريق'];
    if (!allowedStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: '❌ حالة غير صالحة' });
    }

    const updated = await cart
      .findByIdAndUpdate(cartId, { status }, { new: true })
      .populate('partId userId');
    //  const updateOrder=await Order.findByIdAndUpdate(
    //     cartId,
    //     { status },
    //     { new: true }
    //   ).populate('partId userId');
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: '❌ لم يتم العثور على العنصر' });
    }

    res.status(200).json({
      success: true,
      message: '✅ تم تحديث حالة القطعة',
      updatedItem: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: '❌ فشل في تحديث الحالة',
      error: error.message,
    });
  }
};
