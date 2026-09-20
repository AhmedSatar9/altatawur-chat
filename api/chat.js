export default async function handler(req, res) {
  // السماح فقط بطلبات POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed"
    });
  }

  try {
    // التأكد من وجود مفتاح OpenAI
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error("OPENAI_API_KEY is missing");

      return res.status(500).json({
        error: "مفتاح OpenAI غير موجود في إعدادات Vercel."
      });
    }

    // قراءة الرسائل
    const { messages } = req.body || {};

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: "الرسائل غير صحيحة."
      });
    }

    // الاتصال بـ OpenAI
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model: "gpt-5.6-luna",
          messages: messages
        })
      }
    );

    // قراءة استجابة OpenAI
    const data = await response.json();

    // إذا حدث خطأ من OpenAI
    if (!response.ok) {
      console.error("OpenAI Error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "حدث خطأ من خدمة الذكاء الاصطناعي."
      });
    }

    // استخراج الرد
    const reply =
      data?.choices?.[0]?.message?.content;

    if (!reply) {
      console.error("No reply returned:", data);

      return res.status(500).json({
        error: "لم يتم استلام رد من الذكاء الاصطناعي."
      });
    }

    // إرسال الرد للموقع
    return res.status(200).json({
      reply: reply
    });

  } catch (error) {
    console.error("Server Error:", error);

    return res.status(500).json({
      error: error?.message || "حدث خطأ في الخادم."
    });
  }
}
