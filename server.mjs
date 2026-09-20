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
  console.error("❌ OPENAI_API_KEY غير موجود.");
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
       SYSTEM INSTRUCTIONS
    ========================== */

    const systemMessage = {
      role: "system",

      content: `
أنت المساعد الرسمي لمنصة التطور چات.

أجب بالعربية بشكل واضح ومفيد.

استخدم اللهجة العراقية عندما يطلب المستخدم ذلك
أو عندما تكون مناسبة للسياق.

إذا أرسل المستخدم صورة:

- حلل الصورة بدقة.
- أجب عن الأسئلة المتعلقة بالصورة.
- صف محتوى الصورة عند الطلب.
- اقرأ النصوص الظاهرة في الصورة عندما تكون واضحة.
- إذا كان جزء من الصورة غير واضح، قل ذلك بوضوح.
- لا تخمّن معلومات غير ظاهرة في الصورة.

لا تدّعي تنفيذ أي إجراء لم تنفذه فعلياً.
`
    };


    /* =========================
       CONVERT MESSAGES
    ========================== */

    const convertedMessages = [];


    for (
      const message
      of messages.slice(-30)
    ) {

      /*
        =========================
        USER
        =========================
      */

      if (
        message.role === "user"
      ) {

        /*
          رسالة متعددة المحتوى
        */

        if (
          Array.isArray(message.content)
        ) {

          const content = [];


          for (
            const item
            of message.content
          ) {

            /* TEXT */

            if (
              item?.type === "input_text" ||
              item?.type === "text"
            ) {

              const text =
                String(
                  item.text || ""
                );


              if (text.trim()) {

                content.push({

                  type:
                    "text",

                  text

                });

              }

            }


            /* IMAGE */

            if (
              item?.type === "input_image" ||
              item?.type === "image_url"
            ) {

              let imageData =
                item.image_url;


              /*
                إذا جاءت من index.html
                تكون String مباشرة.
              */

              if (
                typeof imageData === "string"
              ) {

                content.push({

                  type:
                    "image_url",

                  image_url: {

                    url:
                      imageData

                  }

                });

              }

            }

          }


          if (content.length > 0) {

            convertedMessages.push({

              role:
                "user",

              content

            });

          }

        }

        /*
          رسالة نصية عادية
        */

        else {

          const text =
            String(
              message.content || ""
            );


          if (text.trim()) {

            convertedMessages.push({

              role:
                "user",

              content:
                text

            });

          }

        }

      }


      /*
        =========================
        ASSISTANT
        =========================
      */

      else if (
        message.role === "assistant"
      ) {

        const text =
          String(
            message.content || ""
          );


        if (text.trim()) {

          convertedMessages.push({

            role:
              "assistant",

            content:
              text

          });

        }

      }

    }


    /* =========================
       FINAL MESSAGES
    ========================== */

    const finalMessages = [

      systemMessage,

      ...convertedMessages

    ];


    if (
      finalMessages.length === 1
    ) {

      return res.status(400).json({

        error:
          "لم يتم العثور على محتوى صالح."

      });

    }


    /* =========================
       SEND TO OPENAI
    ========================== */

    console.log(
      "📨 إرسال الطلب إلى OpenAI..."
    );


    const response =
      await client.chat.completions.create({

        model:
          "gpt-5.6-luna",

        messages:
          finalMessages

      });


    /* =========================
       GET REPLY
    ========================== */

    const reply =
      response?.choices?.[0]?.message?.content;


    if (
      !reply ||
      !String(reply).trim()
    ) {

      console.error(
        "❌ OpenAI لم يرجع نصاً:",
        response
      );


      return res.status(500).json({

        error:
          "لم يصل رد نصي من الذكاء الاصطناعي."

      });

    }


    /* =========================
       SUCCESS
    ========================== */

    console.log(
      "✅ تم استلام الرد من OpenAI"
    );


    return res.status(200).json({

      reply:
        String(reply).trim()

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
