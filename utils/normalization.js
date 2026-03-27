const normalizeRawText = (text = '') => {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const manufacturerMap = {
  audi: ['audi', 'أودي', 'اودي'],
  bmw: ['bmw', 'بي ام دبليو', 'بى ام دبليو', 'بي ام', 'بيم'],
  mercedes: ['mercedes', 'mercedes benz', 'mercedes-benz', 'مرسيدس', 'مرسيدس بنز'],
  toyota: ['toyota', 'تويوتا'],
  hyundai: ['hyundai', 'هيونداي', 'هونداي'],
  kia: ['kia', 'كيا'],
  nissan: ['nissan', 'نيسان'],
  honda: ['honda', 'هوندا'],
  mazda: ['mazda', 'مازدا'],
  mitsubishi: ['mitsubishi', 'ميتسوبيشي'],
  suzuki: ['suzuki', 'سوزوكي'],
  subaru: ['subaru', 'سوبارو'],
  isuzu: ['isuzu', 'ايسوزو', 'إيسوزو'],
  chevrolet: ['chevrolet', 'chevy', 'شيفروليه', 'شفروليه', 'شيفر'],
  ford: ['ford', 'فورد'],
  dodge: ['dodge', 'دودج'],
  jeep: ['jeep', 'جيب'],
  chrysler: ['chrysler', 'كرايسلر'],
  gmc: ['gmc', 'جي ام سي', 'جمس'],
  cadillac: ['cadillac', 'كاديلاك'],
  lexus: ['lexus', 'لكزس'],
  infiniti: ['infiniti', 'انفينيتي'],
  acura: ['acura', 'اكورا', 'أكيورا'],
  volkswagen: ['volkswagen', 'vw', 'فولكس فاجن', 'فولكس واجن', 'فولكس'],
  skoda: ['skoda', 'سكودا'],
  seat: ['seat', 'سيات'],
  renault: ['renault', 'رينو'],
  peugeot: ['peugeot', 'بيجو'],
  citroen: ['citroen', 'سيتروين'],
  fiat: ['fiat', 'فيات'],
  opel: ['opel', 'اوبل', 'أوبل'],
  daewoo: ['daewoo', 'دايو'],
  volvo: ['volvo', 'فولفو'],
  porsche: ['porsche', 'بورش'],
  landrover: ['land rover', 'landrover', 'لاند روفر'],
  rover: ['rover', 'روفر'],
};

const modelMap = {
  elantra: ['elantra', 'النترا', 'الينترا'],
  accent: ['accent', 'اكسنت', 'أكسنت'],
  sonata: ['sonata', 'سوناتا'],
  tucson: ['tucson', 'توسان'],
  santa_fe: ['santa fe', 'santafe', 'سانتا في', 'سانتافي'],
  avante: ['avante', 'افانتي', 'أفانتي'],
  kona: ['kona', 'كونا'],

  cerato: ['cerato', 'سيراتو'],
  optima: ['optima', 'اوبتيما', 'أوبتيما'],
  sportage: ['sportage', 'سبورتاج'],
  sorento: ['sorento', 'سورينتو'],
  picanto: ['picanto', 'بيكانتو'],
  rio: ['rio', 'ريو'],

  corolla: ['corolla', 'كورولا'],
  camry: ['camry', 'كامري'],
  yaris: ['yaris', 'يارس'],
  avalon: ['avalon', 'افالون', 'أفالون'],
  rav4: ['rav4', 'rav 4', 'راف4', 'راف 4'],
  prado: ['prado', 'برادو'],
  land_cruiser: ['land cruiser', 'landcruiser', 'لاند كروزر'],
  hilux: ['hilux', 'هايلوكس'],

  civic: ['civic', 'سيفيك'],
  accord: ['accord', 'اكورد', 'أكورد'],
  city: ['city', 'سيتي'],
  crv: ['crv', 'cr-v', 'سي ار في'],
  pilot: ['pilot', 'بايلوت'],

  sunny: ['sunny', 'صني'],
  sentra: ['sentra', 'سنترا'],
  altima: ['altima', 'التيما', 'ألتيما'],
  maxima: ['maxima', 'ماكسيما'],
  patrol: ['patrol', 'باترول'],
  xtrail: ['x trail', 'x-trail', 'اكس تريل', 'إكس تريل'],
  qashqai: ['qashqai', 'كاشكاي'],

  a3: ['a3', 'a 3', 'اي 3'],
  a4: ['a4', 'a 4', 'اي 4'],
  a5: ['a5', 'a 5', 'اي 5'],
  a6: ['a6', 'a 6', 'اي 6'],
  q3: ['q3', 'q 3', 'كيو 3'],
  q5: ['q5', 'q 5', 'كيو 5'],
  q7: ['q7', 'q 7', 'كيو 7'],

  x1: ['x1', 'x 1', 'اكس 1'],
  x3: ['x3', 'x 3', 'اكس 3'],
  x5: ['x5', 'x 5', 'اكس 5'],
  series_3: ['3 series', '3series', 'الفئه 3', 'الفئة 3'],
  series_5: ['5 series', '5series', 'الفئه 5', 'الفئة 5'],

  c_class: ['c class', 'c-class', 'سي كلاس'],
  e_class: ['e class', 'e-class', 'اي كلاس'],
  s_class: ['s class', 's-class', 'اس كلاس'],
  gla: ['gla', 'جي ال اي'],
  glc: ['glc', 'جي ال سي'],

  passat: ['passat', 'باسات'],
  jetta: ['jetta', 'جيتا'],
  golf: ['golf', 'غولف', 'جولف'],
  tiguan: ['tiguan', 'تيجوان'],
  touareg: ['touareg', 'طوارق'],

  megane: ['megane', 'ميجان'],
  fluence: ['fluence', 'فلوانس'],
  logan: ['logan', 'لوجان'],
  duster: ['duster', 'داستر'],
  symbol: ['symbol', 'سيمبول'],

  206: ['206'],
  207: ['207'],
  208: ['208'],
  301: ['301'],
  307: ['307'],
  308: ['308'],
  406: ['406'],
  407: ['407'],
  508: ['508'],

  lancer: ['lancer', 'لانسر'],
  pajero: ['pajero', 'باجيرو'],
  outlander: ['outlander', 'اوتلاندر', 'أوتلاندر'],

  mazda3: ['mazda 3', 'mazda3', 'مازدا 3'],
  mazda6: ['mazda 6', 'mazda6', 'مازدا 6'],
  cx3: ['cx3', 'cx-3'],
  cx5: ['cx5', 'cx-5'],
  cx9: ['cx9', 'cx-9'],

  malibu: ['malibu', 'ماليبو'],
  cruze: ['cruze', 'كروز'],
  captiva: ['captiva', 'كابتيفا'],
  tahoe: ['tahoe', 'تاهو'],
  suburban: ['suburban', 'سوبربان'],

  fusion: ['fusion', 'فيوجن'],
  focus: ['focus', 'فوكس'],
  explorer: ['explorer', 'اكسبلورر', 'إكسبلورر'],
  escape: ['escape', 'اسكيب'],
  expedition: ['expedition', 'اكسبديشن', 'إكسبديشن'],

  charger: ['charger', 'تشارجر'],
  challenger: ['challenger', 'تشالنجر'],
  durango: ['durango', 'دورانجو'],
};

const normalizeByMap = (value = '', dictionary = {}) => {
  const normalized = normalizeRawText(value);

  for (const canonical in dictionary) {
    const aliases = dictionary[canonical].map(normalizeRawText);
    if (aliases.includes(normalized)) {
      return canonical;
    }
  }

  return normalized.replace(/\s+/g, '_');
};

const normalizeManufacturer = (value) => normalizeByMap(value, manufacturerMap);
const normalizeModel = (value) => normalizeByMap(value, modelMap);

module.exports = {
  normalizeRawText,
  normalizeManufacturer,
  normalizeModel,
  manufacturerMap,
  modelMap,
};