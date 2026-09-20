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
  console.error("❌ OPENAI_API_KEY غير موجود في ملف .env");
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
    /* التأكد من مفتاح OpenAI */
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error:
          "مفتاح OpenAI غير موجود في إعدادات السيرفر."
      });
    }
    /* =========================
       قراءة البيانات
    ========================== */
    const messages =
      Array.isArray(req.body?.messages)
        ? req.body.messages
        : [];
    if (!messages.length) {
      return res.status(400).json({
        error:
          "لا توجد رسائل."
      });
    }
    /* =========================
       تحويل الرسائل
    ========================== */
    const input = messages
      .slice(-30)
      .map((message) => {
        const role =
          message.role === "assistant"
            ? "assistant"
            : "user";
        return {
          role,
          content:
            String(
              message.content || ""
            )
        };
      });
    /* =========================
       المرفق
    ========================== */
    /*
      الواجهة يمكنها إرسال مرفق
      بهذا الشكل:
      {
        name: "image.jpg",
        type: "image/jpeg",
        data: "data:image/jpeg;base64,..."
      }
      حالياً نعالجه هنا
      ونحوّله إلى input مناسب.
    */
    const attachment =
      req.body?.attachment || null;
    if (
      attachment &&
      attachment.data
    ) {
      const lastMessage =
        input[input.length - 1];
      /*
        إذا كان المرفق صورة
      */
      if (
        attachment.type &&
        attachment.type.startsWith(
          "image/"
        )
      ) {
        if (
          lastMessage &&
          lastMessage.role === "user"
        ) {
          lastMessage.content = [
            {
              type:
                "input_text",
              text:
                lastMessage.content ||
                "حلل هذه الصورة."
            },
            {
              type:
                "input_image",
              image_url:
                attachment.data
            }
          ];
        }
      }
      /*
        الملفات غير الصور
        نضيف معلوماتها حالياً
        إلى الرسالة.
      */
      else {
        if (
          lastMessage &&
          lastMessage.role === "user"
        ) {
          lastMessage.content =
            `${lastMessage.content || ""}
📎 المرفق:
اسم الملف: ${
              attachment.name || "ملف"
            }
نوع الملف: ${
              attachment.type || "غير معروف"
            }`;
        }
      }
    }
    /* =========================
       OPENAI RESPONSES API
    ========================== */
    const response =
      await client.responses.create({
        model:
          "gpt-5.5",
        instructions:
          `
أنت المساعد الرسمي لمنصة التطور چات.
أجب بالعربية بشكل واضح ومفيد.
استخدم اللهجة العراقية فقط عندما يطلب المستخدم ذلك.
إذا أرسل المستخدم صورة، قم بتحليلها والإجابة عن طلبه اعتماداً على محتواها.
إذا لم تكن متأكداً من معلومة، لا تخترعها.
لا تدّعي تنفيذ أي إجراء لم تنفذه فعلياً.
حافظ على إجابات مفيدة ومباشرة.
`,
        input,
        store: false
      });
    /* =========================
       الرد
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
    return res.status(500).json({
      error:
        error?.message ||
        "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي."
    });
  }
});
/* =========================
   404
========================= */
app.use(
  (req, res) => {
    res.status(404).json({
      error:
        "الصفحة أو المسار غير موجود."
    });
  }
);
/* =========================
   START SERVER
========================= */
app.listen(
  port,
  () => {
    console.log(
      `🚀 التطور چات يعمل على المنفذ ${port}`
    );
  }
);
