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

/* =========================
   إعدادات الموقع
========================= */

app.use(
  express.json({
    limit: "20mb"
  })
);

/* ملفات الموقع */
app.use(express.static(__dirname));

/* الصفحة الرئيسية */
app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "index.html")
  );
});

/* =========================
   CHAT API
========================= */

app.post("/api/chat", async (req, res) => {
  try {
    const messages = Array.isArray(
      req.body.messages
    )
      ? req.body.messages
      : [];

    if (!messages.length) {
      return res.status(400).json({
        error: "لا توجد رسالة."
      });
    }

    /*
      نأخذ آخر 30 رسالة فقط
      حتى لا يكبر الطلب بشكل مبالغ فيه.
    */

    const lastMessages = messages.slice(-30);

    const input = [];

    for (const message of lastMessages) {

      /*
        رسالة تحتوي على نص فقط
      */

      if (
        message.role === "user" ||
        message.role === "assistant"
      ) {

        /*
          إذا كانت الرسالة تحتوي على صورة
          نرسلها كرابط Data URL
        */

        if (
          message.image &&
          typeof message.image === "string"
        ) {

          const content = [];

          if (message.content) {
            content.push({
              type: "input_text",
              text: String(
                message.content
              )
            });
          }

          content.push({
            type: "input_image",
            image_url: message.image
          });

          input.push({
            role:
              message.role === "assistant"
                ? "assistant"
                : "user",

            content
          });

        } else {

          /*
            رسالة نصية عادية
          */

          input.push({
            role:
              message.role === "assistant"
                ? "assistant"
                : "user",

            content: String(
              message.content || ""
            )
          });
        }
      }
    }

    /* =========================
       الاتصال بـ OpenAI
    ========================= */

    const response =
      await client.responses.create({

        model: "gpt-5.5",

        instructions:
          "أنت المساعد الرسمي لمنصة التطور چات. أجب بالعربية بشكل واضح ومفيد. استخدم اللهجة العراقية عندما يطلب المستخدم ذلك. إذا أرسل المستخدم صورة، حلل محتواها بدقة وأجب عن طلبه المتعلق بها. لا تدّعي تنفيذ أفعال لم تنفذها.",

        input,

        store: false
      });

    /* =========================
       استخراج الرد
    ========================= */

    const reply =
      response.output_text ||
      "ما حصلت جواب نصي من النموذج.";

    return res.status(200).json({
      reply
    });

  } catch (error) {

    console.error(
      "OpenAI Error:",
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
   تشغيل السيرفر
========================= */

app.listen(port, () => {
  console.log(
    `التطور چات يعمل على المنفذ ${port}`
  );
});
