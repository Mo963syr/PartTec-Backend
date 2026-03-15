// controllers/orderController.js
const mongoose = require('mongoose');
const Cart = require('../models/cart.model');
const Order = require('../models/order.model');
const User = require('../models/user.model');
const SpicificOrder = require('../models/spicificPartOrder.model');
// const OrderSummary = require('../models/orderSummary.model');

const Part = require('../models/part.Model');
let OrderSummary = null;
try {
  OrderSummary = require('../models/orderSummary.model');
} catch (_) {}

function sellerTopic(supplierId) {
  return `seller-${String(supplierId).replace(/[^a-zA-Z0-9_\-\.~%]/g, '_')}`;
}

async function getSuppliersFromOrderRefs({ cartIds = [], summaryIds = [] }) {
  const supplierIds = new Set();

  if (cartIds?.length) {
    const carts = await Cart.find({ _id: { $in: cartIds } })
      .select('partId')
      .lean();
    const partIds = carts.map((c) => c.partId).filter(Boolean);

    if (partIds.length) {
      const parts = await Part.find({ _id: { $in: partIds } })
        .select('sellerId')
        .lean();
      for (const p of parts) {
        if (p?.sellerId) supplierIds.add(String(p.sellerId));
      }
    }
  }

  if (summaryIds?.length && OrderSummary) {
    const summaries = await OrderSummary.find({ _id: { $in: summaryIds } })
      .select('sellerId supplierId')
      .lean();
    for (const s of summaries) {
      const sid = s?.sellerId || s?.supplierId;
      if (sid) supplierIds.add(String(sid));
    }
  }

  return Array.from(supplierIds);
}

async function notifySupplierOrderRequested(supplierId, orderId) {
  const message = {
    topic: sellerTopic(supplierId),
    notification: {
      title: 'طلب جديد',
      body: 'لقد تم طلب فاتورة',
    },
    data: {
      type: 'order-request',
      orderId: String(orderId),
      supplierId: String(supplierId),
    },
    android: {
      notification: {
        channelId: 'high_importance_channel',
        priority: 'high',
      },
    },
  };
  return admin.messaging().send(message);
}

exports.createOrder = async (req, res) => {
  try {
    const { userId, cartIds = [], summaryIds = [], location } = req.body;

    if (!userId) {
      return res.status(400).json({ ok: false, error: 'missing_userId' });
    }
    if (
      (!cartIds || cartIds.length === 0) &&
      (!summaryIds || summaryIds.length === 0)
    ) {
      return res.status(400).json({ ok: false, error: 'no_items' });
    }

    const orderDoc = await Order.create({
      userId,
      cartIds,
      summaryIds,
      location, // { type:'Point', coordinates:[lng, lat] } إذا أرسلته من الفرونت
      status: 'مؤكد', // حسب سكيمتك الافتراضية
    });

    const supplierIds = await getSuppliersFromOrderRefs({
      cartIds,
      summaryIds,
    });

    const results = await Promise.allSettled(
      supplierIds.map((sid) => notifySupplierOrderRequested(sid, orderDoc._id)),
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - sent;

    return res.status(201).json({
      ok: true,
      orderId: orderDoc._id,
      suppliersCount: supplierIds.length,
      notifications: { sent, failed },
    });
  } catch (err) {
    console.error('createOrder error:', err);
    return res.status(500).json({ ok: false, error: 'failed_to_create_order' });
  }
};
exports.deleteorder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (
      order.createdAt &&
      Date.now() - new Date(order.createdAt).getTime() > 30 * 60 * 1000 &&  order.status == 'مؤكد'
    ) {
      return res
        .status(400)
        .json({ ok: false, error: 'cannot_delete_after_30_minutes' });
    }
    if (
      order.status == 'موافق عليها' &&
      Date.now() - new Date(order.updatedAt).getTime() > 20 * 60 * 1000
    ) {
      {
        return res.status(400).json({
          ok: false,
          error: 'cannot_delete_order_after_20_minutes_confirmation',
        });
      }
    }
    if (
      order.status == 'تم التوصيل' 
    ) {
      {
        return res.status(400).json({
          ok: false,
          error: 'cannot_delete_delivered_order',
        });
      }
    }

    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).json({ ok: false, error: 'Order not found' });
    }

    return res
      .status(200)
      .json({ ok: true, message: 'Order deleted successfully' });
  } catch (err) {
    console.error('deleteorder error:', err);
    return res.status(500).json({ ok: false, error: 'failed_to_delete_order' });
  }
};

exports.getOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      orderId: order._id,
      status: order.status,
      paymentStatus: order.payment.status,
    });
  } catch (err) {
    console.error('Error fetching order status:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateOrderStatuss = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      orderId: order._id,
      status: order.status,
      paymentStatus: order.payment.status,
    });
  } catch (err) {
    console.error('Error fetching order status:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (status) {
      order.status = status;
      await order.save();
    }

    res.json({
      message: 'Order status updated',
      orderId: order._id,
      status: order.status,
    });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getOrdersWithAverageRatings = async (req, res) => {
  try {
    const orders = await Order.find().populate({
      path: 'cartIds',
      populate: {
        path: 'partId',
        select: '_id ratings',
      },
    });

    const seen = new Set();
    const results = [];

    orders.forEach((order) => {
      order.cartIds.forEach((cart) => {
        const partId = cart.partId?._id?.toString();

        if (partId) {
          if (cart.partId?.ratings && cart.partId.ratings.length > 0) {
            cart.partId.ratings.forEach((r) => {
              const key = `${r.user}-${partId}-${r.rating}`;
              if (!seen.has(key)) {
                seen.add(key);
                results.push({
                  user_id: r.user.toString(),
                  item_id: partId,
                  rating: r.rating,
                });
              }
            });
          } else {
            const key = `null-${partId}-null`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({
                user_id: null,
                item_id: partId,
                rating: null,
              });
            }
          }
        }
      });
    });

    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطأ في جلب البيانات' });
  }
};

exports.getUserBrandOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('prands name phoneNumber');
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

    const brands = Array.isArray(user.prands) ? user.prands : [];
    if (brands.length === 0) return res.json([]);

    const orders = await SpicificOrder.find({
      manufacturer: { $in: brands },
    }).lean();

    const ordersWithUser = orders.map((order) => ({
      ...order,
      userId: user._id,
      userName: user.name,
      phoneNumber: user.phoneNumber,
    }));

    res.json(ordersWithUser);
  } catch (err) {
    res.status(500).json({ message: 'خطأ في الخادم', error: err.message });
  }
};
exports.addOrder = async (req, res) => {
  const start = Date.now();
  try {
    const { userId, coordinates,fee } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: '⚠️ معرف المستخدم غير صالح',
        executionTime: `${Date.now() - start} ms`,
      });
    }

    const existingOrder = await Order.find({
      userId,
      status: { $ne: 'تم التوصيل' },
    });
    if (existingOrder.length >= 3) {
      return res.status(400).json({
        success: false,
        message: '⚠️ لا يمكن إنشاء أكثر من 3 طلبات غير مكتملة',
        executionTime: `${Date.now() - start} ms`,
      });
    }

    if (
      !coordinates ||
      !Array.isArray(coordinates) ||
      coordinates.length !== 2
    ) {
      return res.status(400).json({
        success: false,
        message: '⚠️ الموقع الجغرافي غير صالح (يتطلب [lng, lat])',
        executionTime: `${Date.now() - start} ms`,
      });
    }

    // if (typeof fee !== 'number' || fee < 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: '⚠️ قيمة رسوم التوصيل غير صالحة',
    //     executionTime: `${Date.now() - start} ms`,
    //   });
    // }

    const userCartItems = await Cart.find({
      userId,
      status: 'قيد المعالجة',
    }).populate('partId');

    const userspiciorder = await OrderSummary.find({
      status: 'قيد المعالجة',
    })
      .populate({
        path: 'order',
        match: { user: userId },
      })
      .sort({ createdAt: -1 });

    if (userCartItems.length === 0 && userspiciorder.length === 0) {
      return res.status(404).json({
        success: false,
        message: '🚫 لا توجد منتجات في السلة لهذا المستخدم',
        executionTime: `${Date.now() - start} ms`,
      });
    }

    const filteredSummaries = userspiciorder.filter((s) => s.order !== null);

    const cartIds = userCartItems.map((item) => item._id);
    const summaryIds = filteredSummaries.map((item) => item._id);

    const userDoc = await User.findById(userId).select('province provinceNorm');
    const orderProvince = (userDoc?.province || '').toString();
    const orderProvinceNorm = (userDoc?.provinceNorm || orderProvince)
      .toString()
      .trim()
      .toLowerCase();

    const newOrder = new Order({
      userId,
      cartIds,
      summaryIds,
      location: { type: 'Point', coordinates },
      delivery: {
        province: orderProvince,
        provinceNorm: orderProvinceNorm,
        fee: fee,
      },
      status: 'مؤكد',
    });

    await newOrder.save();

    await Promise.all([
      Cart.updateMany({ _id: { $in: cartIds } }, { $set: { status: 'مؤكد' } }),
      OrderSummary.updateMany(
        { _id: { $in: summaryIds } },
        { $set: { status: 'مؤكد' } },
      ),
    ]);

    const sellerIds = [
      ...new Set(
        userCartItems
          .filter((item) => item.partId && item.partId.sellerId)
          .map((item) => item.partId.sellerId.toString()),
      ),
    ];

    const end = Date.now();
    const executionTime = `${end - start} ms`;
    console.log(`⏱️ addOrder executed in ${executionTime}`);

    res.status(201).json({
      success: true,
      message: '✅ تم إنشاء الطلب وتحديث حالة السلة بنجاح',
      orderId: newOrder._id,
      order: newOrder,
      sellersNotified: sellerIds.length,
      executionTime,
    });
  } catch (error) {
    const end = Date.now();
    const executionTime = `${end - start} ms`;
    console.error(`❌ خطأ في إنشاء الطلب بعد ${executionTime}:`, error);
    res.status(500).json({
      success: false,
      message: '❌ فشل في إنشاء الطلب',
      error: error.message,
      executionTime,
    });
  }
};

exports.vieworderitem = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: '⚠️ معرف المستخدم غير صالح',
      });
    }

    const orders = await Order.find({ userId })
      .populate({
        path: 'cartIds',
        populate: {
          path: 'partId',
          select: '-__v -compatibleCars -comments',
        },
      })
      .populate({
        path: 'summaryIds',
        populate: [
          {
            path: 'order',
            select: 'name manufacturer model year status imageUrls user notes',
          },
          {
            path: 'offer',
            select: 'price imageUrl description status',
            populate: { path: 'seller', select: 'name email' },
          },
        ],
      })
      .sort({ createdAt: -1 });

    const formattedOrders = orders.map((order) => {
      const cartItems = order.cartIds
        .filter((item) => item.partId)
        .map((item) => ({
          partId: item.partId,
          quantity: item.quantity,
          status: item.status,
          source: 'cart',
        }));

      const summaryItems = order.summaryIds
        .filter((summary) => summary.offer && summary.order)
        .map((summary) => ({
          partId: {
            _id: summary.order._id,
            name: summary.order.name,
            manufacturer: summary.order.manufacturer,
            model: summary.order.model,
            year: summary.order.year,
            status: summary.order.status,
            imageUrl: summary.offer.imageUrls || summary.order.imageUrls,
            notes: summary.offer.notes || summary.order.notes,
            user: summary.order.user,
            price: summary.offer.price,
          },

          quantity: 1,
          status: summary.order.status,
          seller: summary.offer.seller,
          source: 'summary',
        }));

      const allItems = [...cartItems, ...summaryItems];

      const totalAmount = allItems.reduce((sum, item) => {
        const price = item.price || item.partId.price || 0;
        return sum + (item.quantity || 1) * price;
      }, 0);
      const fee = order.delivery?.fee || 0;
      return {
        orderId: order._id,
        status: order.status,
        createdAt: order.createdAt,
        location: order.location,
        cartIds: allItems,
        totalAmount,
        fee,
        grandTotal: totalAmount + fee,
      };
    });

    res.status(200).json({
      success: true,
      message: '✅ تم تحميل الطلبات بنجاح',
      orders: formattedOrders,
    });
  } catch (error) {
    console.error('❌ حدث خطأ أثناء جلب الطلبات:', error);
    res.status(500).json({
      success: false,
      message: '❌ فشل في تحميل الطلبات',
      error: error.message,
    });
  }
};

exports.viewspicificorderitem = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: '⚠️ معرف المستخدم غير صالح',
      });
    }

    const orders = await SpicificOrder.find({ user: userId });

    res.status(200).json({
      success: true,
      message: '✅ تم تحميل الطلبات بنجاح',
      orders,
    });
  } catch (error) {
    console.error('حدث خطأ أثناء جلب الطلبات:', error);
    res.status(500).json({
      success: false,
      message: '❌ فشل في تحميل الطلبات',
      error: error.message,
    });
  }
};

// exports.viewspicificordercompleted = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({
//         success: false,
//         message: '⚠️ معرف المستخدم غير صالح',
//       });
//     }

//     const orders = await Order.find({ userId: userId ,status:'تم التوصيل' });

//     res.status(200).json({
//       success: true,
//       message: '✅ تم تحميل الطلبات بنجاح',
//       orders,
//     });
//   } catch (error) {
//     console.error('حدث خطأ أثناء جلب الطلبات:', error);
//     res.status(500).json({
//       success: false,
//       message: '❌ فشل في تحميل الطلبات',
//       error: error.message,
//     });
//   }
// };
exports.getOrdersForSeller = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;

    const orders = await Order.find()
      .populate({
        path: 'cartIds',
        populate: {
          path: 'partId',
          match: { user: sellerId },
          select: 'name price user imageUrl location',
        },
      })
      .populate('userId', 'name email');

    const ordersWithSummary = await Order.find()
      .populate({
        path: 'summaryIds',
        populate: [
          {
            path: 'order',
            select:
              'name serialNumber manufacturer model year status imageUrl user',
          },
          {
            path: 'offer',
            match: { seller: sellerId },
            select: 'status description imageUrl price',
          },
        ],
      })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    const fromCart = orders
      .map((order) => {
        const sellerParts = order.cartIds.filter((item) => item.partId);
        if (sellerParts.length === 0) return null;

        return {
          orderId: order._id,
          customer: {
            _id: order.userId?._id,
            name: order.userId?.name,
            email: order.userId?.email,
          },
          status: order.status,
          createdAt: order.createdAt,
          source: 'cart',
          items: sellerParts.map((item) => ({
            partId: item.partId._id,
            name: item.partId.name,
            manufacturer: null,
            model: null,
            year: null,
            price: item.partId.price,
            quantity: item.quantity,
            total: item.quantity * (item.partId.price || 0),
            imageUrl: item.partId.imageUrl,
            location: item.partId.location || '',
            description: '',
          })),
          totalAmount: sellerParts.reduce(
            (sum, item) => sum + item.quantity * (item.partId.price || 0),
            0,
          ),
        };
      })
      .filter(Boolean);

    const fromSummary = ordersWithSummary
      .map((order) => {
        const matchedSummaries = order.summaryIds.filter(
          (s) => s.offer && s.order,
        );

        if (matchedSummaries.length === 0) return null;

        return {
          orderId: order._id,
          customer: {
            _id: order.userId?._id,
            name: order.userId?.name,
            email: order.userId?.email,
          },
          status: order.status,
          createdAt: order.createdAt,
          source: 'summary',
          items: matchedSummaries.map((summary) => ({
            partId: summary.order._id,
            name: summary.order.name,
            manufacturer: summary.order.manufacturer,
            model: summary.order.model,
            year: summary.order.year,
            price: summary.offer.price,
            quantity: 1,
            total: summary.offer.price,
            imageUrl: summary.offer.imageUrl || '',
            location: '',
            description: summary.offer.description || '',
          })),
          totalAmount: matchedSummaries.reduce(
            (sum, s) => sum + (s.offer?.price || 0),
            0,
          ),
        };
      })
      .filter(Boolean);

    const allOrders = [...fromCart, ...fromSummary].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    res.status(200).json({
      success: true,
      orders: allOrders,
    });
  } catch (error) {
    console.error('❌ Error fetching seller orders:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب الطلبات الخاصة بالبائع',
      error: error.message,
    });
  }
};
exports.viewspicificordercompleted = async (req, res) => {
  try {
    const sellerId = req.params.userId;

    const orders = await Order.find({ userId: sellerId, status: 'تم التوصيل' })
      .populate({
        path: 'cartIds',
        populate: {
          path: 'partId',
          select: 'name price user imageUrl location',
        },
      })
      .populate('userId', 'name email');

    const ordersWithSummary = await Order.find({
      userId: sellerId,
      status: 'تم التوصيل',
    })
      .populate({
        path: 'summaryIds',
        populate: [
          {
            path: 'order',
            select:
              'name serialNumber manufacturer model year status imageUrl user',
          },
          {
            path: 'offer',
            select: 'status description imageUrl price',
          },
        ],
      })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    const fromCart = orders
      .map((order) => {
        const sellerParts = order.cartIds.filter((item) => item.partId);
        if (sellerParts.length === 0) return null;

        return {
          orderId: order._id,
          customer: {
            _id: order.userId?._id,
            name: order.userId?.name,
            email: order.userId?.email,
          },
          status: order.status,
          createdAt: order.createdAt,
          source: 'cart',
          items: sellerParts.map((item) => ({
            partId: item.partId._id,
            name: item.partId.name,
            manufacturer: null,
            model: null,
            year: null,
            price: item.partId.price,
            quantity: item.quantity,
            total: item.quantity * (item.partId.price || 0),
            imageUrl: item.partId.imageUrl,
            location: item.partId.location || '',
            description: '',
          })),
          totalAmount: sellerParts.reduce(
            (sum, item) => sum + item.quantity * (item.partId.price || 0),
            0,
          ),
        };
      })
      .filter(Boolean);

    const fromSummary = ordersWithSummary
      .map((order) => {
        const matchedSummaries = order.summaryIds.filter(
          (s) => s.offer && s.order,
        );

        if (matchedSummaries.length === 0) return null;

        return {
          orderId: order._id,
          customer: {
            _id: order.userId?._id,
            name: order.userId?.name,
            email: order.userId?.email,
          },
          status: order.status,
          createdAt: order.createdAt,
          source: 'summary',
          items: matchedSummaries.map((summary) => ({
            partId: summary.order._id,
            name: summary.order.name,
            manufacturer: summary.order.manufacturer,
            model: summary.order.model,
            year: summary.order.year,
            price: summary.offer.price,
            quantity: 1,
            total: summary.offer.price,
            imageUrl: summary.offer.imageUrl || '',
            location: '',
            description: summary.offer.description || '',
          })),
          totalAmount: matchedSummaries.reduce(
            (sum, s) => sum + (s.offer?.price || 0),
            0,
          ),
        };
      })
      .filter(Boolean);

    const allOrders = [...fromCart, ...fromSummary].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    res.status(200).json({
      success: true,
      orders: allOrders,
    });
  } catch (error) {
    console.error('❌ Error fetching seller orders:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب الطلبات الخاصة بالبائع',
      error: error.message,
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      'قيد التجهيز',
      'مؤكد',
      'ملغي',
      'على الطريق',
      'تم التوصيل',
      'موافق عليها',
    ];
    if (!allowedStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: '❌ حالة غير صالحة' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: '❌ الطلب غير موجود' });
    }

    order.status = status;
    await order.save();

    await Cart.updateMany(
      { _id: { $in: order.cartIds } },
      { $set: { status } },
    );

    res.status(200).json({
      success: true,
      message: '✅ تم تحديث حالة الطلب وجميع عناصر السلة المرتبطة به',
      order,
    });
  } catch (error) {
    console.error('❌ خطأ في تحديث الحالة:', error);
    res.status(500).json({
      success: false,
      message: '❌ فشل في تحديث حالة الطلب',
      error: error.message,
    });
  }
};
