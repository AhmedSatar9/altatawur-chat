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

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/*
  نرفع الحد لأن الصور تصل كـ Base64.
  الحد الأقصى العملي للصورة من الواجهة سيكون 6MB.
*/
app.use(express.json({ limit: "10mb" }));

/* الصفحة الرئيسية */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* ملفات الموقع */
app.use(express.static(__dirname));

/* =========================
   CHAT API
========================= */

app.post("/api/chat", async (req, res) => {
  try {
    const messages = Array.isArray(req.body?.messages)
      ? req.body.messages
      : [];

    const image = req.body?.image || null;

    if (!messages.length && !image) {
      return res.status(400).json({
        error: "لا توجد رسالة أو صورة."
      });
    }

    /*
      آخر 30 رسالة نصية فقط
    */
    const previousMessages = messages
      .slice(-30)
      .map((m) => ({
        role:
          m.role === "assistant"
            ? "assistant"
            : "user",
        content: String(m.content || "")
      }));

    /*
      نبني الإدخال بطريقة Responses API
    */
    const input = [];

    for (const message of previousMessages) {
      input.push({
        role: message.role,
        content: [
          {
            type: "input_text",
            text: message.content
          }
        ]
      });
    }

    /*
      إذا توجد صورة، نضيفها إلى آخر طلب
    */
    if (image) {
      input.push({
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              previousMessages.length
                ? "حلل الصورة المرفقة وأجب عن طلب المستخدم."
                : "حلل الصورة المرفقة."
          },
          {
            type: "input_image",
            image_url: image
          }
        ]
      });
    }

    const response = await client.responses.create({
      model: "gpt-5.6-luna",

      instructions:
        "أنت المساعد الرسمي لمنصة التطور چات. " +
        "أجب بالعربية بشكل واضح ومفيد. " +
        "استخدم اللهجة العراقية عندما يطلب المستخدم ذلك. " +
        "إذا أرسل المستخدم صورة، حلل محتواها بدقة وأجب بناءً عليها. " +
        "لا تدّعي تنفيذ أفعال لم تنفذها.",

      input,

      store: false
    });

    const reply =
      response.output_text ||
      "ما حصلت جواب نصي من النموذج.";

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error("OpenAI Error:", error);

    return res.status(500).json({
      error:
        error?.message ||
        "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي."
    });
  }
});

/* تشغيل السيرفر */
app.listen(port, () => {
  console.log(
    `التطور چات يعمل على المنفذ ${port}`
  );
});
