const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

const carRoutes = require('./routes/car.Routes');
const userRoutes = require('./routes/user.Routes');
const partRoutes = require('./routes/part.Routes');
const cartRoutes = require('./routes/cart.Routes');
const orderRoutes = require('./routes/order.routes');
const modelsRoute = require('./routes/models');
const favoritesRoutes = require('./routes/favorites.Routes');
const req = require('./routes/recommendationOffer.Routes');
const deliveryRoutes = require('./routes/delivery.routes');
const Comment = require('./routes/comment.routes');
const admin = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/payment.Routes');
const pricingRoutes = require('./routes/pricingRoutes');
const carBrands = require('./routes/carBrands.Routes');
const seedData = require('./seed/carSeeder');

const app = express();

// Middlewares (مرة واحدة فقط)
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ✅ اجمع كل الراوتات داخل Router واحد
const api = express.Router();

api.use('/pricing', pricingRoutes);
api.use('/cars', carRoutes);
api.use('/car-brands', carBrands);
api.use('/admin', admin);
api.use('/user', userRoutes);
api.use('/auth', userRoutes);
api.use('/part', partRoutes);
api.use('/cart', cartRoutes);
api.use('/delivery', deliveryRoutes);
api.use('/order', orderRoutes);
api.use('/api/models', modelsRoute);
api.use('/favorites', favoritesRoutes);
api.use('/order', req);
api.use('/comment', Comment);
api.use('/payment', paymentRoutes);

// ✅ هنا نضيف البريفكس مرة واحدة لكل API
app.use('/parttec', api);

const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:59567',
    'http://localhost:3000',
    'http://127.0.0.1:59567',
    'http://187.124.3.3',
  ],
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));

app.options('*', cors()); // مهم جداً للـ preflight


// Health endpoints (خليها بدون prefix أو حطها ضمن /parttec حسب رغبتك)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  const uri = process.env.MONGO_URI;

  mongoose
    .connect(uri)
    .then(async () => {
      console.log('✅ تم الاتصال بقاعدة بيانات PartTec في MongoDB Atlas');
      app.listen(PORT, () => console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`));
      await seedData();
    })
    .catch((err) => console.error('❌ فشل الاتصال:', err));
}

module.exports = app;