const User = require('../models/user.model');
const Order = require('../models/order.model');

exports.getDashboardStats = async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    const ordersCount = await Order.countDocuments();
    const deliveredOrdersCount = await Order.countDocuments({
      status: 'تم التوصيل',
    });
    const deliveryUsersCount = await User.countDocuments({ role: 'delevery' });
    const sellerUsersCount = await User.countDocuments({ role: 'seller' });

    res.json({
      usersCount,
      ordersCount,
      deliveredOrdersCount,
      deliveryUsersCount,
      sellerUsersCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
