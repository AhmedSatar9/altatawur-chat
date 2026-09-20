import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
app.use(
  express.json({
    limit: "25mb"
  })
);
app.use(express.static("public"));
/* =========================
   CHAT API
========================= */
app.post("/api/chat", async (req, res) => {
  try {
    const messages = Array.isArray(req.body.messages)
      ? req.body.messages
      : [];
    const attachment = req.body.attachment || null;
    if (!messages.length) {
      return res.status(400).json({
        error: "لا توجد رسالة."
      });
    }
    /* =========================
       تحويل المحادثة
    ========================= */
    const input = [];
    for (const message of messages.slice(-30)) {
      if (!message.content) continue;
      input.push({
        role:
          message.role === "assistant"
            ? "assistant"
            : "user",
        content: [
          {
            type: "input_text",
            text: String(message.content)
          }
        ]
      });
    }
    /* =========================
       إضافة الصورة أو الملف
    ========================= */
    if (attachment) {
      const lastMessage =
        input[input.length - 1];
      if (
        lastMessage &&
        lastMessage.role === "user"
      ) {
        /* صورة */
        if (
          attachment.type &&
          attachment.type.startsWith("image/")
        ) {
          if (!attachment.data) {
            return res.status(400).json({
              error: "بيانات الصورة غير موجودة."
            });
          }
          lastMessage.content.push({
            type: "input_image",
            image_url: attachment.data,
            detail: "auto"
          });
        }
        /* ملف */
        else {
          if (!attachment.data) {
            return res.status(400).json({
              error: "بيانات الملف غير موجودة."
            });
          }
          lastMessage.content.push({
            type: "input_file",
            filename:
              attachment.name || "file",
            file_data:
              attachment.data
          });
        }
      }
    }
    /* =========================
       OPENAI
    ========================= */
    const response =
      await client.responses.create({
        model: "gpt-5.5",
        instructions:
          "أنت المساعد الرسمي لمنصة التطور چات. أجب بالعربية بشكل واضح ومفيد. استخدم اللهجة العراقية فقط عندما يطلب المستخدم ذلك. إذا أرسل المستخدم صورة أو ملفاً، حلله اعتماداً على محتواه الفعلي ولا تدّعي رؤية أو قراءة شيء غير موجود.",
        input: input,
        store: false
      });
    /* =========================
       RESPONSE
    ========================= */
    res.json({
      reply:
        response.output_text ||
        "ما حصلت جواب نصي من النموذج."
    });
  } catch (error) {
    console.error(
      "OPENAI ERROR:",
      error
    );
    res.status(500).json({
      error:
        "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي."
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
      `التطور چات يعمل على http://localhost:${port}`
    );
  }
);
