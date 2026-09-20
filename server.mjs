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
      نحافظ على آخر 30 رسالة
      حتى لا يكبر حجم الطلب.
    */

    const recentMessages =
      messages.slice(-30);

    /*
      تحويل رسائل الموقع
      إلى صيغة Responses API
    */

    const input =
      recentMessages.map(message => {

        /*
          رسالة المستخدم
        */

        if (message.role === "user") {

          /*
            إذا كانت الرسالة تحتوي
            على صورة
          */

          if (
            Array.isArray(message.content)
          ) {

            const content =
              message.content
                .map(item => {

                  /*
                    نص
                  */

                  if (
                    item.type === "text"
                  ) {

                    return {
                      type: "input_text",
                      text:
                        String(
                          item.text || ""
                        )
                    };

                  }

                  /*
                    صورة
                  */

                  if (
                    item.type === "image_url"
                  ) {

                    return {
                      type: "input_image",
                      image_url:
                        item.image_url
                    };

                  }

                  return null;

                })
                .filter(Boolean);

            return {
              role: "user",
              content
            };
          }

          /*
            رسالة مستخدم عادية
          */

          return {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  String(
                    message.content || ""
                  )
              }
            ]
          };
        }

        /*
          رسائل المساعد السابقة
        */

        if (
          message.role === "assistant"
        ) {

          return {
            role: "assistant",
            content: [
              {
                type: "output_text",
                text:
                  String(
                    message.content || ""
                  )
              }
            ]
          };

        }

        return null;

      }).filter(Boolean);

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
- أجب عن أسئلة المستخدم المتعلقة بالصورة.
- لا تدّعي رؤية شيء غير واضح في الصورة.

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
   START SERVER
========================= */

app.listen(
  port,
  () => {

    console.log(
      `التطور چات يعمل على المنفذ ${port}`
    );

  }
);
