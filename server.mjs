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

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("❌ OPENAI_API_KEY غير موجود في ملف .env");
}

const client = new OpenAI({
  apiKey
});

/* =========================
   MIDDLEWARE
========================= */

app.use(
  express.json({
    limit: "30mb"
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

    /* =========================
       CHECK API KEY
    ========================== */

    if (!apiKey) {

      return res.status(500).json({
        error:
          "مفتاح OpenAI غير موجود في إعدادات السيرفر."
      });

    }


    /* =========================
       READ MESSAGES
    ========================== */

    const messages =
      Array.isArray(req.body?.messages)
        ? req.body.messages
        : [];


    if (!messages.length) {

      return res.status(400).json({
        error:
          "لا توجد رسالة."
      });

    }


    /* =========================
       LAST 30 MESSAGES
    ========================== */

    const recentMessages =
      messages.slice(-30);


    /* =========================
       CONVERT TO RESPONSES INPUT
    ========================== */

    const input = [];


    for (const message of recentMessages) {

      /*
        =========================
        USER MESSAGE
        =========================
      */

      if (message.role === "user") {

        /*
          رسالة تحتوي على محتوى متعدد
          نص + صورة
        */

        if (
          Array.isArray(message.content)
        ) {

          const content = [];


          for (
            const item
            of message.content
          ) {

            /*
              TEXT
            */

            if (
              item?.type === "input_text"
            ) {

              const text =
                String(
                  item.text || ""
                ).trim();


              if (text) {

                content.push({

                  type:
                    "input_text",

                  text

                });

              }

            }


            /*
              IMAGE
            */

            else if (
              item?.type === "input_image"
            ) {

              let imageUrl =
                item.image_url;


              /*
                نتأكد أن الصورة
                Data URL صحيحة
              */

              if (
                typeof imageUrl === "string" &&
                imageUrl.startsWith("data:image/")
              ) {

                content.push({

                  type:
                    "input_image",

                  image_url:
                    imageUrl

                });

              }

            }

          }


          /*
            لا نرسل رسالة فارغة
          */

          if (content.length > 0) {

            input.push({

              role:
                "user",

              content

            });

          }

        }

        /*
          USER MESSAGE عادية
        */

        else {

          const text =
            String(
              message.content || ""
            ).trim();


          if (text) {

            input.push({

              role:
                "user",

              content: [

                {

                  type:
                    "input_text",

                  text

                }

              ]

            });

          }

        }

      }


      /*
        =========================
        ASSISTANT MESSAGE
        =========================
      */

      else if (
        message.role === "assistant"
      ) {

        const text =
          String(
            message.content || ""
          ).trim();


        if (text) {

          input.push({

            role:
              "assistant",

            content: [

              {

                type:
                  "output_text",

                text

              }

            ]

          });

        }

      }

    }


    /* =========================
       CHECK INPUT
    ========================== */

    if (!input.length) {

      return res.status(400).json({

        error:
          "لم يتم العثور على محتوى صالح للإرسال."

      });

    }


    /* =========================
       OPENAI
    ========================== */

    console.log(
      "📨 إرسال طلب إلى OpenAI..."
    );


    const response =
      await client.responses.create({

        model:
          "gpt-5.6-luna",

        instructions:
          `
أنت المساعد الرسمي لمنصة التطور چات.

أجب بالعربية بشكل واضح ومفيد.

استخدم اللهجة العراقية عندما يطلب المستخدم ذلك
أو عندما يكون استخدامها مناسباً للسياق.

إذا أرسل المستخدم صورة:

- حلل الصورة بدقة.
- أجب عن الأسئلة المتعلقة بالصورة.
- صف محتوى الصورة عند الطلب.
- اقرأ النصوص الظاهرة في الصورة عندما تكون واضحة.
- إذا كان جزء من الصورة غير واضح، قل ذلك بوضوح.
- لا تخمّن معلومات غير ظاهرة في الصورة.

إذا أرسل المستخدم ملفاً أو معلومات، تعامل معها حسب المحتوى المتاح لك.

لا تدّعي تنفيذ أي إجراء لم تنفذه فعلياً.
`,

        input,

        store:
          false

      });


    /* =========================
       GET RESPONSE
    ========================== */

    const reply =
      response?.output_text ||
      "";


    if (!reply.trim()) {

      console.error(
        "OpenAI returned no text:",
        response
      );


      return res.status(500).json({

        error:
          "تمت معالجة الطلب ولكن لم يصل رد نصي من الذكاء الاصطناعي."

      });

    }


    /* =========================
       SEND RESPONSE
    ========================== */

    console.log(
      "✅ تم استلام رد OpenAI"
    );


    return res.status(200).json({

      reply:
        reply.trim()

    });

  }


  /* =========================
     ERROR
  ========================== */

  catch (error) {

    console.error(
      "❌ OpenAI Error:",
      error
    );


    /*
      OpenAI API ERROR
    */

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
      `🚀 التطور چات يعمل على المنفذ ${port}`
    );

  }
);
