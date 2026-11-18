const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp'); // ✅ استدعاء المكتبة

const UPLOAD_DIR = 'uploads/parts';

// إنشاء المجلد مرة واحدة
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ✅ التخزين في الذاكرة (RAM) بدلاً من القرص مباشرة
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExt = /\.(jpeg|jpg|png|webp)$/i;
  const allowedMime = /^image\/(jpeg|jpg|png|webp)$/i;

  if (allowedExt.test(file.originalname) && allowedMime.test(file.mimetype)) {
    return cb(null, true);
  }
  cb(new Error('صيغة الصورة غير مدعومة. المسموح: jpeg, jpg, png, webp'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // رفعنا الحد إلى 10 ميجا (لأننا سنضغطها لاحقاً)
    files: 10,
  },
});

// ✅ دالة جديدة لضغط الصور وحفظها على القرص
upload.processImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  try {
    const processedFiles = [];

    for (const file of req.files) {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const filename = `${unique}.webp`; // سنحول الصور إلى صيغة WebP (الأفضل للويب)
      const filePath = path.join(UPLOAD_DIR, filename);

      // ضغط الصورة وتغيير حجمها
      await sharp(file.buffer)
        .resize({ width: 1200, withoutEnlargement: true }) // أقصى عرض 1200 بكسل (دون تكبير الصور الصغيرة)
        .webp({ quality: 80 }) // تحويل إلى WebP بجودة 80% (توازن ممتاز بين الحجم والجودة)
        .toFile(filePath);

      // تحديث بيانات الملف ليتطابق مع ما يتوقعه الكنترولر
      processedFiles.push({
        ...file,
        filename: filename,
        path: filePath,
      });
    }

    // استبدال الملفات الأصلية بالملفات المضغوطة
    req.files = processedFiles;
    next();
  } catch (error) {
    console.error('❌ خطأ أثناء ضغط الصور:', error);
    upload.cleanupFiles(req.files); // دالة الحذف التي أضفناها سابقاً
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء معالجة الصور',
    });
  }
};

// ==========================================
// الدوال المساعدة (كما هي دون تغيير)
// ==========================================
upload.handleMulterError = (error, res) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ success: false, message: 'الحد الأقصى 10 صور' });
    if (error.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, message: 'حجم الصورة يجب أن يكون أقل من 10MB' });
    if (error.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ success: false, message: 'اسم حقل الصور غير صحيح. استخدم "images"' });
    return res.status(400).json({ success: false, message: `خطأ في رفع الصور: ${error.message}` });
  }
  if (error && error.message?.includes('صيغة الصورة')) {
    return res.status(400).json({ success: false, message: error.message });
  }
  return null;
};

upload.cleanupFiles = (files) => {
  if (!files || !files.length) return;
  files.forEach((file) => {
    // في حالة الـ memoryStorage، لا يوجد ملف على القرص لحذفه إلا إذا مررنا من processImages
    if (file.path && fs.existsSync(file.path)) {
      fs.unlink(file.path, (err) => {
        if (err) console.warn('⚠️ فشل حذف الصورة اليتيمة:', file.path);
      });
    }
  });
};

upload.deleteByUrl = (url) => {
  if (!url) return;
  try {
    const filename = url.split('/').pop();
    const filePath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.warn('⚠️ فشل حذف الصورة:', filePath);
      });
    }
  } catch (e) {
    console.warn('⚠️ خطأ في حذف الصورة:', e.message);
  }
};

module.exports = upload;