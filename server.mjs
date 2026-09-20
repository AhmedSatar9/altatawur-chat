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
  console.error(
    "❌ OPENAI_API_KEY غير موجود"
  );
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
    path.join(
      __dirname,
      "index.html"
    )
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
app.post(
  "/api/chat",
  async (req, res) => {
    try {
      const messages =
        Array.isArray(
          req.body?.messages
        )
          ? req.body.messages
          : [];
      if (!messages.length) {
        return res.status(400).json({
          error: "لا توجد رسالة."
        });
      }
      /*
        نأخذ آخر 30 رسالة
      */
      const recentMessages =
        messages.slice(-30);
      /*
        تحويل رسائل الموقع
        إلى صيغة Chat Completions
      */
      const apiMessages = [];
      for (
        const message
        of recentMessages
      ) {
        if (
          !message ||
          !message.role
        ) {
          continue;
        }
        /* =========================
           USER
        ========================== */
        if (
          message.role === "user"
        ) {
          const content = [];
          /*
            النص
          */
          if (
            message.content
          ) {
            content.push({
              type: "text",
              text:
                String(
                  message.content
                )
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
              type: "image_url",
              image_url: {
                url:
                  String(
                    message.attachment.data
                  )
              }
            });
          }
          /*
            لا نضيف رسالة فارغة
          */
          if (
            content.length
          ) {
            apiMessages.push({
              role: "user",
              content
            });
          }
          continue;
        }
        /* =========================
           ASSISTANT
        ========================== */
        if (
          message.role === "assistant"
        ) {
          if (
            message.content
          ) {
            apiMessages.push({
              role: "assistant",
              content:
                String(
                  message.content
                )
            });
          }
          continue;
        }
      }
      /*
        التأكد من وجود رسائل
      */
      if (
        !apiMessages.length
      ) {
        return res.status(400).json({
          error:
            "لم يتم العثور على محتوى صالح."
        });
      }
      console.log(
        "📨 إرسال الطلب إلى OpenAI..."
      );
      /* =========================
         OPENAI
      ========================== */
      const completion =
        await client.chat.completions.create({
          model:
            "gpt-5.6-luna",
          messages: [
            {
              role: "system",
              content: `
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
- إذا كانت الصورة غير واضحة أخبر المستخدم بذلك.
إذا كان السؤال عادياً:
أجب بشكل مباشر وواضح.
لا تدّعي تنفيذ أي إجراء لم تنفذه فعلياً.
              `
            },
            ...apiMessages
          ]
        });
      /* =========================
         RESPONSE
      ========================== */
      const reply =
        completion
          ?.choices?.[0]
          ?.message
          ?.content
        ||
        "ما حصلت جواب نصي من النموذج.";
      console.log(
        "✅ تم استلام الرد من OpenAI"
      );
      return res.status(200).json({
        reply
      });
    } catch (error) {
      console.error(
        "❌ OpenAI ERROR:"
      );
      console.error(
        error
      );
      const errorMessage =
        error?.error?.message ||
        error?.message ||
        "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.";
      return res.status(500).json({
        error:
          errorMessage
      });
    }
  }
);
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
