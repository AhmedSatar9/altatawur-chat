import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/*
  =========================
  SETTINGS
  =========================
*/

const MAX_MESSAGES = 20;
const MAX_TEXT_LENGTH = 12000;
const MAX_IMAGE_LENGTH = 12 * 1024 * 1024;

/*
  =========================
  HANDLER
  =========================
*/

export default async function handler(req, res) {

  /* =========================
     METHOD
  ========================== */

  if (req.method !== "POST") {

    return res.status(405).json({
      error: "Method Not Allowed"
    });

  }


  try {

    /* =========================
       API KEY
    ========================== */

    const apiKey =
      process.env.OPENAI_API_KEY;

    if (!apiKey) {

      console.error(
        "OPENAI_API_KEY is missing"
      );

      return res.status(500).json({
        error:
          "مفتاح OpenAI غير موجود في إعدادات Vercel."
      });

    }


    /* =========================
       REQUEST BODY
    ========================== */

    const messages =
      Array.isArray(req.body?.messages)
        ? req.body.messages
        : [];


    if (!messages.length) {

      return res.status(400).json({
        error: "لا توجد رسائل."
      });

    }


    /*
      نأخذ آخر 20 رسالة فقط
      للحفاظ على سرعة الاستجابة
      وتقليل حجم الطلب.
    */

    const recentMessages =
      messages.slice(-MAX_MESSAGES);


    /* =========================
       BUILD INPUT
    ========================== */

    const input = [];


    for (const message of recentMessages) {

      if (!message) continue;


      /* =========================
         USER MESSAGE
      ========================== */

      if (message.role === "user") {


        /*
          رسالة تحتوي على نص وصورة
        */

        if (Array.isArray(message.content)) {

          const content = [];


          for (const item of message.content) {

            if (!item) continue;


            /* =========================
               TEXT
            ========================== */

            if (
              item.type === "input_text"
            ) {

              let text =
                String(item.text || "");


              if (
                text.length >
                MAX_TEXT_LENGTH
              ) {

                text =
                  text.slice(
                    0,
                    MAX_TEXT_LENGTH
                  );

              }


              if (text.trim()) {

                content.push({

                  type:
                    "input_text",

                  text

                });

              }


              continue;
            }


            /* =========================
               IMAGE
            ========================== */

            if (
              item.type === "input_image"
            ) {

              const imageUrl =
                String(
                  item.image_url || ""
                );


              if (
                imageUrl.startsWith(
                  "data:image/"
                ) &&
                imageUrl.length <=
                  MAX_IMAGE_LENGTH
              ) {

                content.push({

                  type:
                    "input_image",

                  image_url:
                    imageUrl

                });

              }


              continue;
            }


            /*
              دعم صيغة الصورة القديمة
            */

            if (
              item.type === "image_url"
            ) {

              let imageUrl = "";


              if (
                typeof item.image_url ===
                "string"
              ) {

                imageUrl =
                  item.image_url;

              } else if (
                item.image_url &&
                typeof item.image_url.url ===
                  "string"
              ) {

                imageUrl =
                  item.image_url.url;

              }


              if (
                imageUrl.startsWith(
                  "data:image/"
                ) &&
                imageUrl.length <=
                  MAX_IMAGE_LENGTH
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


          if (content.length) {

            input.push({

              role:
                "user",

              content

            });

          }


          continue;

        }


        /*
          رسالة نصية عادية
        */

        let text =
          String(
            message.content || ""
          );


        if (
          text.length >
          MAX_TEXT_LENGTH
        ) {

          text =
            text.slice(
              0,
              MAX_TEXT_LENGTH
            );

        }


        if (text.trim()) {

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


        continue;

      }


      /* =========================
         ASSISTANT MESSAGE
      ========================== */

      if (
        message.role === "assistant"
      ) {

        let text =
          String(
            message.content || ""
          );


        if (
          text.length >
          MAX_TEXT_LENGTH
        ) {

          text =
            text.slice(
              0,
              MAX_TEXT_LENGTH
            );

        }


        if (text.trim()) {

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
       VALID INPUT
    ========================== */

    if (!input.length) {

      return res.status(400).json({

        error:
          "لم يتم العثور على محتوى صالح."

      });

    }


    /* =========================
       OPENAI
    ========================== */

    const response =
      await client.responses.create({

        model:
          "gpt-5.6-luna",

        instructions: `

أنت المساعد الرسمي لمنصة "التطور چات".

أجب بالعربية بشكل واضح ومفيد.

استخدم اللهجة العراقية عندما يطلب المستخدم ذلك
أو عندما تكون مناسبة للسياق.

قواعد سياق المحادثة:

- حافظ على سياق المحادثة السابقة.
- اربط السؤال الحالي بالرسائل السابقة.
- افهم كلمات مثل:
  "هذا"، "هذه"، "هو"، "هي"، "ذلك"، "نفسه"
  بالاعتماد على السياق السابق.
- لا تطلب من المستخدم إعادة معلومة موجودة
  بالفعل في سياق المحادثة.
- لا تعيد شرح معلومات سابقة إلا إذا كان ذلك مفيداً.

قواعد الصور:

- افحص الصور المرفقة بعناية.
- اقرأ النصوص الموجودة في الصورة قدر الإمكان.
- حلل التفاصيل المرتبطة بسؤال المستخدم.
- إذا كانت الصورة غير واضحة، اذكر ذلك.
- لا تخترع تفاصيل غير ظاهرة.
- لا تدّعي رؤية شيء غير موجود في الصورة.

قواعد الإجابة:

- أجب مباشرة على سؤال المستخدم.
- كن واضحاً ومفيداً.
- لا تكرر السؤال.
- لا تدّعي تنفيذ إجراء لم تنفذه.
- إذا لم تعرف الإجابة، قل ذلك بوضوح.

`,

        input,

        store:
          false

      });


    /* =========================
       GET RESPONSE
    ========================== */

    const reply =
      response.output_text ||
      "ما حصلت جواب نصي من النموذج.";


    /* =========================
       RESPONSE
    ========================== */

    return res.status(200).json({

      reply

    });


  } catch (error) {

    console.error(
      "OpenAI Error:",
      error
    );


    /*
      لا نرسل تفاصيل الخطأ الداخلية
      للمستخدم.
    */

    return res.status(500).json({

      error:
        "حدث خطأ أثناء معالجة الطلب. حاول مرة ثانية."

    });

  }

}
