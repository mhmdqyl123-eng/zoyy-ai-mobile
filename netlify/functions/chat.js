const { GoogleGenAI } = require("@google/genai");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 503,
        body: JSON.stringify({ error: "Gemini key is missing" })
      };
    }

    const { message = "", images = [] } = JSON.parse(event.body || "{}");

    if (typeof message !== "string" || !Array.isArray(images) || (!message.trim() && images.length === 0) || images.length > 4 || images.some(x => !x || !["image/jpeg","image/png","image/webp"].includes(x.mimeType) || typeof x.data !== "string" || x.data.length > 5500000) || images.reduce((n,x) => n + (x.data || "").length,0) > 5500000) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "اكتب رسالة صحيحة" })
      };
    }

    const parts = [];
    if (message.trim()) parts.push({ text: message.trim() });

    for (const image of images) {
      const data = image.data.replace(/^data:image\/[^;]+;base64,/, "");
      const buffer = Buffer.from(data, "base64");
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: buffer.toString("base64")
        }
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: [{ role: "user", parts }]
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reply: response.text || "لم يصل رد من Gemini"
      })
    };

  } catch (error) {
    console.error("Gemini error:", error.message);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي"
      })
    };
  }
};
