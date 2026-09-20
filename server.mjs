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
   CHAT API
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
      نأخذ آخر 30 رسالة
    */
    const recentMessages =
      messages.slice(-30);
    /*
      هنا نحول صيغة الموقع
      إلى صيغة Chat Completions
    */
    const apiMessages = [];
    for (const message of recentMessages) {
      if (!message) {
        continue;
      }
      /* =========================
         USER MESSAGE
      ========================== */
      if (message.role === "user") {
        const content = [];
        /*
          الحالة الطبيعية من index.html:
          content: [
            {
              type: "input_text",
              text: "..."
            },
            {
              type: "input_image",
              image_url: "data:image/jpeg;base64,..."
            }
          ]
        */
        if (Array.isArray(message.content)) {
          for (const item of message.content) {
            if (!item) {
              continue;
            }
            /*
              TEXT
            */
            if (
              item.type === "input_text" ||
              item.type === "text"
            ) {
              if (item.text) {
                content.push({
                  type: "text",
                  text:
                    String(item.text)
                });
              }
            }
            /*
              IMAGE
              نحول:
              input_image
              إلى:
              image_url
            */
            else if (
              item.type === "input_image"
            ) {
              let imageUrl =
                item.image_url;
              /*
                إذا كانت الصورة
                موجودة كسلسلة نصية
              */
              if (
                typeof imageUrl === "string" &&
                imageUrl.length > 0
              ) {
                content.push({
                  type: "image_url",
                  image_url: {
                    url: imageUrl
                  }
                });
              }
              /*
                احتياطاً إذا وصلت
                بصيغة object
              */
              else if (
                imageUrl &&
                typeof imageUrl === "object" &&
                imageUrl.url
              ) {
                content.push({
                  type: "image_url",
                  image_url: {
                    url:
                      String(
                        imageUrl.url
                      )
                  }
                });
              }
            }
          }
        }
        /*
          احتياط:
          إذا وصلت الرسالة
          بصيغة attachment
        */
        else if (
          message.attachment &&
          message.attachment.type === "image" &&
          message.attachment.data
        ) {
          if (message.content) {
            content.push({
              type: "text",
              text:
                String(
                  message.content
                )
            });
          }
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
          رسالة نصية عادية
        */
        else if (message.content) {
          content.push({
            type: "text",
            text:
              String(
                message.content
              )
          });
        }
        /*
          نضيف الرسالة إذا بيها محتوى
        */
        if (content.length > 0) {
          apiMessages.push({
            role: "user",
            content
          });
        }
      }
      /* =========================
         ASSISTANT MESSAGE
      ========================== */
      else if (
        message.role === "assistant"
      ) {
        if (
          typeof message.content === "string" &&
          message.content.trim()
        ) {
          apiMessages.push({
            role: "assistant",
            content:
              message.content
          });
        }
      }
    }
    /*
      التأكد من وجود محتوى
    */
    if (!apiMessages.length) {
      return res.status(400).json({
        error:
          "لم يتم العثور على محتوى صالح."
      });
    }
    /*
      LOG للتأكد من الصيغة
    */
    console.log(
      "📨 API Messages:",
      JSON.stringify(
        apiMessages.map(message => ({
          role: message.role,
          contentTypes:
            Array.isArray(message.content)
              ? message.content.map(
                  item => item.type
                )
              : "text"
        }))
      )
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
- إذا كانت الصورة غير واضحة، أخبر المستخدم بذلك.
لا تدّعي تنفيذ أفعال لم تنفذها فعلياً.
            `
          },
          ...apiMessages
        ]
      });
    /* =========================
       RESPONSE
    ========================== */
    const reply =
      completion?.choices?.[0]?.message?.content ||
      "ما حصلت جواب نصي من النموذج.";
    console.log(
      "✅ OpenAI Response received"
    );
    return res.status(200).json({
      reply
    });
  } catch (error) {
    console.error(
      "❌ OPENAI ERROR:"
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
