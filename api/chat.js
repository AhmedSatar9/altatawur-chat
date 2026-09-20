import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* =========================
   SETTINGS
========================= */

const MAX_MESSAGES = 20;
const MAX_TEXT_LENGTH = 12000;
const MAX_IMAGE_LENGTH = 12 * 1024 * 1024;


/* =========================
   API HANDLER
========================= */

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

    if (!process.env.OPENAI_API_KEY) {

      console.error(
        "OPENAI_API_KEY is missing"
      );

      return res.status(500).json({
        error:
          "مفتاح OpenAI غير موجود في إعدادات Vercel."
      });

    }


    /* =========================
       READ REQUEST
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


    /* =========================
       LIMIT CONTEXT
    ========================== */

    const recentMessages =
      messages.slice(-MAX_MESSAGES);


    /* =========================
       CONVERT MESSAGES
    ========================== */

    const input = [];


    for (const message of recentMessages) {

      if (!message) {
        continue;
      }


      /* =========================
         USER
      ========================== */

      if (message.role === "user") {

        /* رسالة متعددة المحتوى */

        if (
          Array.isArray(message.content)
        ) {

          const content = [];


          for (const item of message.content) {

            if (!item) {
              continue;
            }


            /* =========================
               TEXT
            ========================== */

            if (
              item.type === "input_text"
            ) {

              let text =
                String(
                  item.text || ""
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


              /*
                نتأكد أن الصورة
                Data URL حقيقية
              */

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
                    imageUrl,

                  detail:
                    "high"

                });

              }

              continue;

            }


            /*
              دعم الصيغة القديمة
              إذا وصلت من الواجهة
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

              }

              else if (
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
                    imageUrl,

                  detail:
                    "high"

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


        /* =========================
           USER TEXT ONLY
        ========================== */

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
         ASSISTANT
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
       SAFETY CHECK
    ========================== */

    if (!input.length) {

      return res.status(400).json({
        error:
          "لم يتم العثور على محتوى صالح."
      });

    }


    /* =========================
       AI INSTRUCTIONS
    ========================== */

    const instructions = `

أنت المساعد الرسمي لمنصة "التطور چات".

مهمتك تقديم إجابات دقيقة ومفيدة وواضحة.

اللغة:
- استخدم العربية بشكل افتراضي.
- استخدم اللهجة العراقية عندما يطلب المستخدم ذلك أو عندما تكون مناسبة للسياق.
- لا تغيّر أسلوب المستخدم بلا داعٍ.

السياق:
- اعتبر الرسائل السابقة جزءاً من نفس المحادثة.
- اربط الأسئلة الجديدة بالرسائل السابقة عندما يكون ذلك منطقياً.
- إذا قال المستخدم "هذا" أو "هذه" أو "هو" أو "هي"، حاول ربطها بآخر موضوع واضح في المحادثة.
- لا تفترض معلومات غير موجودة في المحادثة.

تحليل الصور:
- عند وجود صورة، افحص الصورة بعناية قبل الإجابة.
- ركز على التفاصيل المرئية المهمة للسؤال.
- اقرأ النصوص الظاهرة في الصورة قدر الإمكان.
- إذا طلب المستخدم التعرف على منتج أو شيء ظاهر بالصورة، صف ما يمكن استنتاجه من الصورة بدقة.
- إذا طلب مقارنة أو تحليل تفاصيل، افحص الصورة كاملة وليس جزءاً واحداً فقط.
- لا تخترع تفاصيل غير واضحة.
- إذا كانت جودة الصورة لا تسمح بالتأكد من معلومة معينة، اذكر درجة عدم اليقين بوضوح.
- لا تقل إنك لا تستطيع رؤية الصورة إذا كانت الصورة مرفقة وقابلة للتحليل.
- لا تدّعي رؤية شيء غير موجود في الصورة.

الدقة:
- افهم السؤال أولاً ثم أجب مباشرة.
- لا تكرر السؤال على المستخدم بلا حاجة.
- إذا كانت هناك عدة نقاط، رتب الإجابة بشكل واضح.
- لا تدّعي تنفيذ أي إجراء لم تنفذه فعلياً.

الخصوصية والأمان:
- لا تطلب مفتاح OpenAI من المستخدم.
- لا تكشف أي مفاتيح API أو أسرار موجودة في الخادم.
`;


    /* =========================
       OPENAI
    ========================== */

    const response =
      await client.responses.create({

        model:
          "gpt-5.6-luna",

        instructions,

        input,

        store:
          false

      });


    /* =========================
       RESPONSE
    ========================== */

    const reply =
      response?.output_text?.trim() ||
      "ما حصلت جواب نصي من النموذج.";


    return res.status(200).json({

      reply

    });


  } catch (error) {

    console.error(
      "OpenAI Error:",
      error
    );


    /*
      لا نرسل تفاصيل تقنية
      حساسة للمتصفح
    */

    return res.status(500).json({

      error:
        "حدث خطأ أثناء معالجة الطلب. حاول مرة ثانية."

    });

  }

}
