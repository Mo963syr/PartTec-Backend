function guessMimeType(originalName = '') {
  const lower = originalName.toLowerCase();

  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';

  return 'image/jpeg';
}

function postProcessVin(input) {
  if (!input) return null;

  let vin = String(input).toUpperCase().trim();

  for (const noise of [
    'SHARE',
    'SHARED',
    'SCAN',
    'COPY',
    'TEXT',
    'PHOTO',
    'IMAGE',
    'VIN',
    'VINNO',
    'NO',
  ]) {
    vin = vin.replaceAll(noise, '');
  }

  vin = vin.replace(/[^A-Z0-9]/g, '');
  vin = vin.replaceAll('O', '0');
  vin = vin.replaceAll('I', '1');
  vin = vin.replaceAll('Q', '0');

  const match = vin.match(/[A-HJ-NPR-Z0-9]{17}/);
  return match ? match[0] : null;
}

function buildVinPrompt() {
  return `
حلل هذه الصورة بعناية واستخرج رقم الشاصي VIN فقط.

القواعد:
- إذا كانت الصورة تحتوي على بطاقة أو ورقة عربية، فابحث أولاً عن السطر المرتبط بعبارة "رقم الهيكل".
- إذا وجدت رقماً بعد عبارة "رقم الهيكل"، فأعد الرقم فقط.
- تجاهل أي كلمات دخيلة أو خاطئة مثل:
SHARE, SHARED, SCAN, COPY, TEXT, IMAGE, PHOTO
- تجاهل أي أرقام ليست VIN مثل أرقام اللوحة أو التواريخ أو الرموز الأخرى.
- أزل الفراغات والشرطات والرموز.
- أعد قيمة vin فقط إذا كان الرقم بطول 17 ويبدو VIN صحيحاً.
- إذا لم تجد رقماً صحيحاً فأعد vin = null.
- لا تعد أي شرح خارج JSON.
  `.trim();
}

module.exports = {
  guessMimeType,
  postProcessVin,
  buildVinPrompt,
};