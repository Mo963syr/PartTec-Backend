const cart = require('../models/cart.model');
const SpicificOrder = require('../models/spicificPartOrder.model');
const User = require('../models/user.model');
const Part = require('../models/part.Model');
const Order = require('../models/order.model');
const OrderSummary = require('../models/orderSummary.model');
const cloudinary = require('../utils/cloudinary');

const mongoose = require('mongoose');

exports.getCartItemsForSeller = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;

    const cartItems = await cart
      .find({ status: 'مؤكد' })
      .populate({
        path: 'partId',
        match: { user: sellerId },
        select: 'name price user imageUrl',
      })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    const filtered = cartItems
      .filter((item) => item.partId)
      .map((item) => ({
        _id: item._id,
        user: item.userId,
        part: item.partId,
        quantity: item.quantity,
        total: item.quantity * (item.partId?.price || 0),
        createdAt: item.createdAt,
      }));

    const totalAmount = filtered.reduce((sum, item) => sum + item.total, 0);

    res.status(200).json({
      success: true,
      items: filtered,
      totalAmount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب عناصر السلة الخاصة بالبائع',
      error: error.message,
    });
  }
};
exports.deleteCartItem = async (req, res) => {
  try {
    const { cartId } = req.params;

    const deletedItem = await cart.findByIdAndDelete(cartId);

    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: '⚠️ عنصر السلة غير موجود',
      });
    }

    res.status(200).json({
      success: true,
      message: '✅ تم حذف عنصر السلة',
      deletedItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في حذف عنصر السلة',
      error: error.message,
    });
  }
};

exports.addPart = async (req, res) => {
  try {
    const { partId, userId, quantity } = req.body;

    const cartData = {
      partId,
      userId,
      quantity,
    };

    const addCart = new cart(cartData);
    await addCart.save();

    res.status(201).json({
      message: '✅ تم إضافة المنتج',
      cartproduct: addCart,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: '❌ فشل في إضافة المنتج', details: error.message });
  }
};
exports.viewcartitem = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: '⚠️ معرف المستخدم غير صالح',
      });
    }

    // جلب عناصر الكارت
    const cartItems = await cart
      .find({ userId, status: 'قيد المعالجة' })
      .populate('partId')
      .sort({ createdAt: -1 });

    // تنسيق عناصر الكارت
    const normalizedCart = cartItems.map((item) => ({
      _id: item._id,
      partId: item.partId
        ? {
            _id: item.partId._id,
            name: item.partId.name,
            manufacturer: item.partId.manufacturer,
            model: item.partId.model,
            year: item.partId.year,
            category: item.partId.category,
            status: item.partId.status,
            price: item.partId.price,
            imageUrl: item.partId.imageUrl,
            user: item.partId.user,
            compatibleCars: item.partId.compatibleCars || [],
            createdAt: item.partId.createdAt,
            updatedAt: item.partId.updatedAt,
            __v: item.partId.__v,
            comments: item.partId.comments || [],
            age: item.partId.age,
            id: item.partId.id,
          }
        : null,
      userId: item.userId,
      quantity: item.quantity,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      __v: item.__v,
      source: 'cart',
    }));

    // ===== جلب الطلبات الخاصة من OrderSummary =====
    const userOrders = await SpicificOrder.find({
      user: userId,
      status: 'قيد المعالجة',
    }).select('_id');
    const orderIds = userOrders.map((o) => o._id);

    const summaries = await OrderSummary.find({
      order: { $in: orderIds },
      status: 'قيد المعالجة',
    })
      .populate('order')
      .populate({
        path: 'offer',
        populate: { path: 'seller', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    // تنسيق البيانات لتكون بنفس شكل الكارت
    const normalizedSummaries = summaries.map((item) => ({
      _id: item._id,
      partId: {
        _id: item.order?._id || null,
        name: item.order?.name || '',
        manufacturer: item.order?.manufacturer || '',
        model: item.order?.model || '',
        year: item.order?.year || null,
        category: item.order?.category || '',
        status: item.status || item.order?.status || '',
        price: item.appliedPrice || 0,
        imageUrl:
          item.appliedImages && item.appliedImages.length > 0
            ? item.appliedImages[0]
            : '',
        user: item.order?.user || userId,
        compatibleCars: [],
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        __v: 0,
        comments: [],
        age: 0,
        id: item.order?._id || null,
      },
      userId: item.order?.user || userId,
      quantity: 1,
      status: item.status || item.order?.status || '',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      __v: 0,
      source: 'summary',
      offer: item.offer
        ? {
            _id: item.offer._id,
            price: item.offer.price,
            description: item.offer.description,
            imageUrl: item.offer.imageUrl,
            status: item.offer.status,
            seller: item.offer.seller
              ? {
                  _id: item.offer.seller._id,
                  name: item.offer.seller.name,
                  email: item.offer.seller.email,
                }
              : null,
          }
        : null,
    }));

    const allItems = [...normalizedCart, ...normalizedSummaries];
    allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      message: '✅ تم تحميل محتويات الكارت بنجاح',
      items: allItems,
    });
  } catch (error) {
    console.error('❌ خطأ أثناء جلب عناصر الكارت:', error);
    res.status(500).json({
      success: false,
      message: '⚠️ فشل في تحميل محتويات الكارت',
      error: error.message,
    });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { cartId } = req.params;
    const updates = { ...req.body };

    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.__v;

    if (updates.status) {
      const allowedStatuses = ['قيد المعالجة', 'مؤكد', 'ملغي', 'على الطريق'];

      if (!allowedStatuses.includes(updates.status)) {
        return res.status(400).json({
          success: false,
          message: '❌ حالة غير صالحة',
        });
      }
    }

    const cartItem = await cart.findById(cartId).populate('partId userId');

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: '❌ لم يتم العثور على العنصر',
      });
    }

    if (updates.quantity !== undefined) {
      const newQuantity = Number(updates.quantity);

      if (!Number.isInteger(newQuantity) || newQuantity < 1) {
        return res.status(400).json({
          success: false,
          message: '❌ الكمية يجب أن تكون رقمًا صحيحًا أكبر من 0',
        });
      }

      const availableCount = Number(cartItem.partId?.count ?? 0);

      if (newQuantity > availableCount) {
        return res.status(400).json({
          success: false,
          message: `❌ الكمية المطلوبة أكبر من المتوفر في المخزون`,
          availableCount,
        });
      }

      updates.quantity = newQuantity;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: '⚠️ لم يتم إرسال أي بيانات للتحديث',
      });
    }

    const updated = await cart
      .findByIdAndUpdate(
        cartId,
        { $set: updates },
        { new: true, runValidators: true },
      )
      .populate('partId userId');

    res.status(200).json({
      success: true,
      message: '✅ تم تحديث بيانات القطعة',
      updatedItem: updated,
    });
  } catch (error) {
    console.error('updateCartItem error:', error);
    res.status(500).json({
      success: false,
      message: '❌ فشل في تحديث البيانات',
      error: error.message,
    });
  }
};
