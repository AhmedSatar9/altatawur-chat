import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 3000;
/* =========================
   OPENAI
========================= */
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY غير موجود في Environment Variables");
}
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
/* =========================
   MIDDLEWARE
========================= */
app.use(
  express.json({
    limit: "25mb"
  })
);
/* =========================
   MAIN PAGE
========================= */
app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "index.html")
  );
});
/* =========================
   STATIC FILES
========================= */
app.use(
  express.static(__dirname)
);
/* =========================
   AI CHAT
========================= */
app.post("/api/chat", async (req, res) => {
  try {
    const messages =
      Array.isArray(req.body?.messages)
        ? req.body.messages
        : [];
    if (!messages.length) {
      return res.status(400).json({
        error: "لا توجد رسالة."
      });
    }
    /*
      نأخذ آخر 30 رسالة فقط
    */
    const recentMessages =
      messages.slice(-30);
    /*
      تحويل رسائل الموقع
      إلى صيغة Responses API
    */
    const input = [];
    for (const message of recentMessages) {
      if (!message || !message.role) {
        continue;
      }
      /* =========================
         USER MESSAGE
      ========================== */
      if (message.role === "user") {
        const content = [];
        /*
          النص
        */
        if (message.content) {
          content.push({
            type: "input_text",
            text: String(message.content)
          });
        }
        /*
          الصورة
        */
        if (
          message.attachment &&
          message.attachment.type === "image" &&
          message.attachment.data
        ) {
          content.push({
            type: "input_image",
            image_url: String(
              message.attachment.data
            ),
            detail: "auto"
          });
        }
        /*
          إذا الرسالة تحتوي
          على نص أو صورة
        */
        if (content.length) {
          input.push({
            role: "user",
            content
          });
        }
        continue;
      }
      /* =========================
         ASSISTANT MESSAGE
      ========================== */
      if (message.role === "assistant") {
        if (message.content) {
          input.push({
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: String(
                  message.content
                )
              }
            ]
          });
        }
        continue;
      }
    }
    /*
      نتأكد أن الإدخال صالح
    */
    if (!input.length) {
      return res.status(400).json({
        error: "لم يتم العثور على محتوى صالح للإرسال."
      });
    }
    /* =========================
       OPENAI RESPONSE
    ========================== */
    const response =
      await client.responses.create({
        model:
          "gpt-5.6-luna",
        instructions:
          `
أنت المساعد الرسمي لمنصة التطور چات.
أجب بالعربية بشكل واضح ومفيد.
استخدم اللهجة العراقية عندما يطلب المستخدم ذلك
أو عندما تكون مناسبة للسياق.
إذا أرسل المستخدم صورة:
- حلل الصورة بدقة.
- صف محتواها عند الطلب.
- اقرأ النص الموجود فيها إن أمكن.
- أجب عن الأسئلة المتعلقة بالصورة.
- لا تدّعي رؤية شيء غير واضح.
- إذا كانت الصورة غير واضحة، أخبر المستخدم بذلك.
إذا أرسل المستخدم سؤالاً عادياً:
- أجب بشكل مباشر وواضح.
- لا تذكر أنك نموذج ذكاء اصطناعي إلا إذا سأل المستخدم عن ذلك.
لا تدّعي تنفيذ أفعال لم تنفذها.
`,
        input,
        store: false
      });
    /* =========================
       RESPONSE TEXT
    ========================== */
    const reply =
      response.output_text ||
      "ما حصلت جواب نصي من النموذج.";
    return res.status(200).json({
      reply
    });
  } catch (error) {
    console.error(
      "❌ OpenAI Error:",
      error
    );
    /*
      استخراج رسالة الخطأ
      بشكل أوضح
    */
    const errorMessage =
      error?.error?.message ||
      error?.message ||
      "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.";
    return res.status(500).json({
      error: errorMessage
    });
  }
});
/* =========================
   START SERVER
========================= */
app.listen(
  port,
  () => {
    console.log(
      `✅ التطور چات يعمل على المنفذ ${port}`
    );
  }
);
