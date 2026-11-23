require('dotenv').config();

const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const apiKey = process.env.GEMINI_API_KEY;
const client = apiKey ? new GoogleGenAI({ apiKey }) : null;

app.get('/api/status', (req, res) => {
  res.json({
    name: 'Zoyy AI',
    status: 'online',
    engine: 'Gemini',
    version: '2.0.0'
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({
        error: 'مفتاح Gemini غير موجود'
      });
    }

    const message = req.body.message;

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: 'اكتب رسالة صحيحة'
      });
    }

    const response = await client.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: message.trim()
    });

    res.json({
      reply: response.text || 'لم يصل رد نصي من Gemini'
    });

  } catch (error) {
    console.error('Gemini error:', error.message);

    res.status(500).json({
      error: 'حدث خطأ أثناء الاتصال بـ Gemini'
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Zoyy AI is running!');
  console.log('Engine: Gemini');
  console.log(`http://127.0.0.1:${PORT}`);
});
