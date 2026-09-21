import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  /*
    =========================
    CORS
    =========================
  */

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  /*
    OPTIONS
  */

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  /*
    فقط POST
  */

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed"
    });
  }

  try {
    /*
      =========================
      MESSAGES
      =========================
    */

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
      نأخذ آخر 30 رسالة فقط
    */

    const recentMessages =
      messages.slice(-30);

    /*
      =========================
      تحويل الرسائل
      =========================
    */

    const input = [];

    for (const message of recentMessages) {

      if (!message) {
        continue;
      }

      /*
        USER
      */

      if (message.role === "user") {

        const content = [];

        /*
          content array
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
                  type: "input_text",
                  text: String(item.text)
                });

              }

            }

            /*
              IMAGE
            */

            else if (
              item.type === "input_image"
            ) {

              let imageUrl =
                item.image_url;

              /*
                string
              */

              if (
                typeof imageUrl === "string" &&
                imageUrl.length > 0
              ) {

                content.push({
                  type: "input_image",
                  image_url: imageUrl
                });

              }

              /*
                object
              */

              else if (
                imageUrl &&
                typeof imageUrl === "object" &&
                imageUrl.url
              ) {

                content.push({
                  type: "input_image",
                  image_url:
                    String(imageUrl.url)
                });

              }

            }

          }

        }

        /*
          attachment احتياطياً
        */

        else if (
          message.attachment &&
          message.attachment.type === "image" &&
          message.attachment.data
        ) {

          if (message.content) {

            content.push({
              type: "input_text",
              text:
                String(message.content)
            });

          }

          content.push({
            type: "input_image",
            image_url:
              String(
                message.attachment.data
              )
          });

        }

        /*
          نص عادي
        */

        else if (message.content) {

          content.push({
            type: "input_text",
            text:
              String(message.content)
          });

        }

        /*
          إضافة رسالة المستخدم
        */

        if (content.length > 0) {

          input.push({
            role: "user",
            content
          });

        }

      }

      /*
        ASSISTANT
      */

      else if (
        message.role === "assistant"
      ) {

        if (
          typeof message.content === "string" &&
          message.content.trim()
        ) {

          input.push({
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: message.content
              }
            ]
          });

        }

      }

    }

    /*
      =========================
      التحقق
      =========================
    */

    if (!input.length) {

      return res.status(400).json({
        error:
          "لم يتم العثور على محتوى صالح."
      });

    }

    /*
      =========================
      OPENAI
      =========================
    */

    const response =
      await client.responses.create({

        model:
          "gpt-5.6-luna",

        instructions: `
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

لا تدّعي تنفيذ أي فعل لم تنفذه فعلياً.

كن مفيداً ومباشراً.
`,

        input

      });

    /*
      =========================
      RESPONSE
      =========================
    */

    const reply =
      response?.output_text ||
      "ما حصلت جواب نصي من النموذج.";

    console.log(
      "✅ OpenAI Response received"
    );

    return res.status(200).json({
      reply
    });

  }

  catch (error) {

    console.error(
      "❌ OPENAI ERROR:"
    );

    console.error(error);

    const errorMessage =
      error?.message ||
      "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.";

    return res.status(500).json({
      error: errorMessage
    });

  }
}
