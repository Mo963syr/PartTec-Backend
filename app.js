// server.js (أو نفس ملف التشغيل)
// ✅ اطبع كل الـ endpoints بشكل مرتب عند تشغيل السيرفر

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

const cors = require('cors');

const app = express();

// Middlewares
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

// ✅ prefix مرة واحدة
app.use('/parttec', api);

// CORS (كما عندك)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

app.use(
  cors({
    origin: [
      'http://localhost:59567',
      'http://localhost:3000',
      'http://127.0.0.1:59567',
      'http://187.124.3.3',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.options('*', cors());

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/* =========================
   ✅ طباعة كل الـ Endpoints
   ========================= */
// ✅ استبدل دوال cleanPath / routePath بحيث تلغي الرموز مثل: /?(?=/|$)/i

function listEndpoints(app) {
  const routes = [];

  const normalizeSlashes = (s) => s.replace(/\/+/g, '/');

  // يحوّل Regex الخاص بالـ Router ل path نظيف (مثل: /parttec, /admin ...)
  function cleanMountPath(layer) {
    if (!layer?.regexp) return '';

    let s = layer.regexp.toString();

    // 1) شيل غلاف الـ regex
    // مثال: /^\/parttec\/?(?=\/|$)/i  =>  /parttec
    s = s
      .replace(/^\/\^\\\//, '/')
      .replace(/\\\/\?\(\?=\\\/\|\$\)\$\/i$/, '')  // شيل \/?(?=\/|$)$/i
      .replace(/\$\/i$/, '')                       // احتياط
      .replace(/\/i$/, '');

    // 2) رجّع السلاشات طبيعية
    s = s.replace(/\\\//g, '/');

    // 3) شيل أي بقايا من: /?(?=/|$)
    s = s.replace(/\/\?\(\?=\/\|\$\)/g, '');
    s = s.replace(/\(\?=\/\|\$\)/g, '');
    s = s.replace(/\/\?/g, ''); // لو بقيت

    // 4) شيل ^ و $ لو بقوا
    s = s.replace(/^\^/, '').replace(/\$$/, '');

    // 5) تأكد أنه يبدأ بسلاش
    if (s && !s.startsWith('/')) s = '/' + s;

    return normalizeSlashes(s);
  }

  function walk(stack, basePath = '') {
    stack.forEach((layer) => {
      // Route مباشر
      if (layer.route) {
        const p = layer.route.path;
        const fullPath = normalizeSlashes(
          (basePath || '') + (p === '/' ? '' : p)
        );

        const methods = Object.keys(layer.route.methods)
          .filter((m) => layer.route.methods[m])
          .map((m) => m.toUpperCase());

        methods.forEach((m) => routes.push({ method: m, path: fullPath || '/' }));
        return;
      }

      // Router
      if (layer.name === 'router' && layer.handle?.stack) {
        const mount = cleanMountPath(layer);
        const nextBase = normalizeSlashes((basePath || '') + (mount || ''));
        walk(layer.handle.stack, nextBase);
      }
    });
  }

  walk(app._router?.stack || [], '');

  // ✅ تجاهل تكرارات وتنسيق نهائي
  const grouped = new Map();
  routes
    .map((r) => ({
      method: r.method,
      path: normalizeSlashes(r.path).replace(/\/$/, '') || '/', // شيل / آخر المسار
    }))
    .sort((a, b) => (a.path === b.path ? a.method.localeCompare(b.method) : a.path.localeCompare(b.path)))
    .forEach(({ method, path }) => {
      if (!grouped.has(path)) grouped.set(path, new Set());
      grouped.get(path).add(method);
    });

  console.log('\n================= ✅ API ENDPOINTS =================');
  [...grouped.entries()].forEach(([path, methodsSet]) => {
    const methods = [...methodsSet].sort().join(', ');
    console.log(`${methods.padEnd(22)} ${path}`);
  });
  console.log('====================================================\n');
}
/* ========================= */

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  const uri = process.env.MONGO_URI;

  mongoose
    .connect(uri)
    .then(async () => {
      console.log('✅ تم الاتصال بقاعدة بيانات PartTec في MongoDB Atlas');
      app.listen(PORT, () => {
        console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
        // ✅ اطبع بعد ما يشتغل السيرفر
        listEndpoints(app);
      });
      await seedData();
    })
    .catch((err) => console.error('❌ فشل الاتصال:', err));
}

module.exports = app;