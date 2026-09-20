import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const MAX_MESSAGES = 20;
const MAX_TEXT_LENGTH = 12000;
const MAX_IMAGE_LENGTH = 12 * 1024 * 1024;

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed"
    });
  }

  try {

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "مفتاح OpenAI غير موجود في إعدادات Vercel."
      });
    }

    const messages =
      Array.isArray(req.body?.messages)
        ? req.body.messages
        : [];

    if (!messages.length) {
      return res.status(400).json({
        error: "لا توجد رسائل."
      });
    }

    const recentMessages =
      messages.slice(-MAX_MESSAGES);

    const input = [];

    for (const message of recentMessages) {

      if (!message) continue;

      /* =========================
         USER
      ========================== */

      if (message.role === "user") {

        if (Array.isArray(message.content)) {

          const content = [];

          for (const item of message.content) {

            if (!item) continue;

            /* TEXT */

            if (item.type === "input_text") {

              let text =
                String(item.text || "");

              if (text.length > MAX_TEXT_LENGTH) {
                text =
                  text.slice(0, MAX_TEXT_LENGTH);
              }

              if (text.trim()) {

                content.push({
                  type: "input_text",
                  text
                });

              }

              continue;
            }

            /* IMAGE */

            if (item.type === "input_image") {

              const imageUrl =
                String(item.image_url || "");

              if (
                imageUrl.startsWith("data:image/") &&
                imageUrl.length <= MAX_IMAGE_LENGTH
              ) {

                content.push({
                  type: "input_image",
                  image_url: imageUrl,
                  detail: "high"
                });

              }

              continue;
            }

            /* OLD IMAGE FORMAT */

            if (item.type === "image_url") {

              let imageUrl = "";

              if (
                typeof item.image_url === "string"
              ) {

                imageUrl = item.image_url;

              } else if (
                item.image_url &&
                typeof item.image_url.url === "string"
              ) {

                imageUrl =
                  item.image_url.url;

              }

              if (
                imageUrl.startsWith("data:image/") &&
                imageUrl.length <= MAX_IMAGE_LENGTH
              ) {

                content.push({
                  type: "input_image",
                  image_url: imageUrl,
                  detail: "high"
                });

              }

            }

          }

          if (content.length) {

            input.push({
              role: "user",
              content
            });

          }

          continue;
        }

        let text =
          String(message.content || "");

        if (text.length > MAX_TEXT_LENGTH) {
          text =
            text.slice(0, MAX_TEXT_LENGTH);
        }

        if (text.trim()) {

          input.push({
            role: "user",
            content: [
              {
                type: "input_text",
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

      if (message.role === "assistant") {

        let text =
          String(message.content || "");

        if (text.length > MAX_TEXT_LENGTH) {
          text =
            text.slice(0, MAX_TEXT_LENGTH);
        }

        if (text.trim()) {

          input.push({
            role: "assistant",
            content: [
              {
                type: "output_text",
                text
              }
            ]
          });

        }

      }

    }

    if (!input.length) {
      return res.status(400).json({
        error: "لم يتم العثور على محتوى صالح."
      });
    }

    /* =========================
       HEADERS
    ========================== */

    res.statusCode = 200;

    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache, no-transform"
    );

    res.setHeader(
      "Connection",
      "keep-alive"
    );

    /* =========================
       AI
    ========================== */

    const stream =
      await client.responses.create({

        model: "gpt-5.6-luna",

        instructions: `

أنت المساعد الرسمي لمنصة "التطور چات".

أجب بالعربية بشكل واضح ومفيد.

استخدم اللهجة العراقية عندما يطلب المستخدم ذلك
أو عندما تكون مناسبة للسياق.

السياق:
- حافظ على سياق المحادثة السابقة.
- اربط الأسئلة الجديدة بالرسائل السابقة.
- افهم الإشارات مثل "هذا" و"هذه" و"هو" و"هي"
  اعتماداً على سياق المحادثة.

الصور:
- افحص الصورة بعناية.
- اقرأ النصوص الموجودة فيها قدر الإمكان.
- حلل التفاصيل المهمة للسؤال.
- لا تخترع تفاصيل غير واضحة.
- إذا كانت الصورة غير واضحة، وضح ذلك.
- لا تدّعي رؤية شيء غير موجود بالصورة.

الدقة:
- أجب مباشرة.
- لا تكرر السؤال بلا حاجة.
- لا تدّعي تنفيذ إجراء لم تنفذه.

`,

        input,

        store: false,

        stream: true

      });

    /* =========================
       STREAM RESPONSE
    ========================== */

    for await (const event of stream) {

      if (
        event.type ===
        "response.output_text.delta"
      ) {

        const text =
          event.delta || "";

        if (text) {

          res.write(text);

        }

      }

    }

    res.end();

  } catch (error) {

    console.error(
      "OpenAI Streaming Error:",
      error
    );

    /*
      إذا لم يبدأ إرسال الرد بعد
    */

    if (!res.headersSent) {

      return res.status(500).json({
        error:
          "حدث خطأ أثناء معالجة الطلب. حاول مرة ثانية."
      });

    }

    /*
      إذا كان الرد بدأ بالفعل
    */

    try {

      res.write(
        "\n\n[حدث خطأ أثناء إكمال الرد]"
      );

    } catch {}

    res.end();

  }

}
