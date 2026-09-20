import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {

  // السماح فقط بطلبات POST
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

      console.error("OPENAI_API_KEY is missing");

      return res.status(500).json({
        error: "مفتاح OpenAI غير موجود في إعدادات Vercel."
      });

    }


    /* =========================
       READ BODY
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
       LIMIT MESSAGES
    ========================== */

    const recentMessages =
      messages.slice(-30);


    /* =========================
       CONVERT TO RESPONSES API
    ========================== */

    const input = recentMessages
      .map((message) => {

        /*
          =========================
          USER MESSAGE
          =========================
        */

        if (message.role === "user") {

          /*
            رسالة تحتوي على نص + صورة
          */

          if (Array.isArray(message.content)) {

            const content =
              message.content
                .map((item) => {

                  /*
                    نص
                  */

                  if (
                    item?.type === "input_text"
                  ) {

                    return {
                      type: "input_text",
                      text: String(
                        item.text || ""
                      )
                    };

                  }


                  /*
                    صورة
                  */

                  if (
                    item?.type === "input_image"
                  ) {

                    if (!item.image_url) {
                      return null;
                    }

                    return {
                      type: "input_image",
                      image_url: item.image_url,
                      detail: "auto"
                    };

                  }


                  /*
                    إذا وصل image_url
                    بدل input_image
                  */

                  if (
                    item?.type === "image_url"
                  ) {

                    if (!item.image_url) {
                      return null;
                    }

                    return {
                      type: "input_image",
                      image_url: item.image_url,
                      detail: "auto"
                    };

                  }


                  return null;

                })
                .filter(Boolean);


            if (!content.length) {
              return null;
            }


            return {
              role: "user",
              content
            };

          }


          /*
            رسالة نصية عادية
          */

          return {
            role: "user",
            content: [
              {
                type: "input_text",
                text: String(
                  message.content || ""
                )
              }
            ]
          };

        }


        /*
          =========================
          ASSISTANT MESSAGE
          =========================

          Responses API يسمح بإعادة
          رسائل المساعد السابقة كسياق.
        */

        if (message.role === "assistant") {

          return {
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: String(
                  message.content || ""
                )
              }
            ]
          };

        }


        return null;

      })
      .filter(Boolean);


    /* =========================
       OPENAI RESPONSES API
    ========================== */

    const response =
      await client.responses.create({

        model: "gpt-5.6-luna",

        instructions: `
أنت المساعد الرسمي لمنصة التطور چات.

أجب بالعربية بشكل واضح ومفيد.

استخدم اللهجة العراقية عندما يطلب المستخدم ذلك
أو عندما تكون مناسبة للسياق.

إذا أرسل المستخدم صورة:

- حلل الصورة بدقة.
- اقرأ النصوص الموجودة فيها إن أمكن.
- أجب عن الأسئلة المتعلقة بالصورة.
- صف محتوى الصورة عند الطلب.
- لا تدّعي رؤية شيء غير واضح.
- إذا كانت الصورة غير واضحة، أخبر المستخدم بذلك بوضوح.

لا تدّعي تنفيذ أي إجراء لم تنفذه فعلياً.

حافظ على سياق المحادثة السابقة.
`,

        input,

        store: false

      });


    /* =========================
       GET RESPONSE TEXT
    ========================== */

    const reply =
      response?.output_text ||
      "ما حصلت جواب نصي من النموذج.";


    /* =========================
       SEND RESPONSE
    ========================== */

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

}
