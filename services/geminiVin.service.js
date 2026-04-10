const { GoogleGenAI, Type } = require('@google/genai');
const { buildVinPrompt, postProcessVin } = require('../utils/vin.utils');
const { VinResult } = require('../models/vin.model');

class GeminiVinService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing');
    }

    this.ai = new GoogleGenAI({ apiKey });
    this.model = 'gemini-2.5-flash';
  }

  async extractVinFromBuffer({ buffer, mimeType }) {
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [
        {
          role: 'user',
          parts: [
            { text: buildVinPrompt() },
            {
              inlineData: {
                mimeType,
                data: buffer.toString('base64'),
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vin: {
              type: Type.STRING,
              nullable: true,
            },
            confidence_note: {
              type: Type.STRING,
            },
          },
          required: ['vin', 'confidence_note'],
        },
      },
    });

    const rawText = response.text ? response.text.trim() : '';

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      parsed = {
        vin: null,
        confidence_note: 'invalid_json',
      };
    }

    const finalVin = postProcessVin(parsed?.vin);

    return new VinResult({
      ok: true,
      vin: finalVin,
      rawVin: parsed?.vin || null,
      confidenceNote: parsed?.confidence_note || '',
      message: finalVin ? 'VIN extracted successfully' : 'VIN not found',
    });
  }
}

module.exports = {
  GeminiVinService,
};
