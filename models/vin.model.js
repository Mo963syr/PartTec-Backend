class VinResult {
  constructor({
    ok = false,
    vin = null,
    rawVin = null,
    confidenceNote = '',
    message = '',
  } = {}) {
    this.ok = ok;
    this.vin = vin;
    this.rawVin = rawVin;
    this.confidenceNote = confidenceNote;
    this.message = message;
  }
}

module.exports = {
  VinResult,
};
