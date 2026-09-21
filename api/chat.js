import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed"
    });
  }

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

    const recentMessages =
      messages.slice(-30);

    const apiMessages = [];

    for (const message of recentMessages) {
      if (!message) {
        continue;
      }

      /* =========================
         USER
      ========================== */

      if (message.role === "user") {
        const content = [];

        if (Array.isArray(message.content)) {
          for (const item of message.content) {
            if (!item) {
              continue;
            }

            /* TEXT */

            if (
              item.type === "input_text" ||
              item.type === "text"
            ) {
              if (item.text) {
                content.push({
                  type: "text",
                  text: String(item.text)
                });
              }
            }

            /* IMAGE */

            else if (
              item.type === "input_image"
            ) {
              const imageUrl =
                item.image_url;

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

              else if (
                imageUrl &&
                typeof imageUrl === "object" &&
                imageUrl.url
              ) {
                content.push({
                  type: "image_url",
                  image_url: {
                    url: String(
                      imageUrl.url
                    )
                  }
                });
              }
            }
          }
        }

        else if (
          message.attachment &&
          message.attachment.type === "image" &&
          message.attachment.data
        ) {
          if (message.content) {
            content.push({
              type: "text",
              text: String(
                message.content
              )
            });
          }

          content.push({
            type: "image_url",
            image_url: {
              url: String(
                message.attachment.data
              )
            }
          });
        }

        else if (message.content) {
          content.push({
            type: "text",
            text: String(
              message.content
            )
          });
        }

        if (content.length > 0) {
          apiMessages.push({
            role: "user",
            content
          });
        }
      }

      /* =========================
         ASSISTANT
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
            content: message.content
          });
        }
      }
    }

    if (!apiMessages.length) {
      return res.status(400).json({
        error:
          "لم يتم العثور على محتوى صالح."
      });
    }

    /* =========================
       OPENAI
    ========================== */

    const completion =
      await client.chat.completions.create({
        model: "gpt-5.6-luna",

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

    const reply =
      completion?.choices?.[0]?.message?.content ||
      "ما حصلت جواب نصي من النموذج.";

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error(
      "❌ VERCEL OPENAI ERROR:",
      error
    );

    const errorMessage =
      error?.error?.message ||
      error?.message ||
      "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.";

    return res.status(500).json({
      error: errorMessage
    });
  }
}
