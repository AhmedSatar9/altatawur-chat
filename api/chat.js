import OpenAI from "openai";

/* =========================
   OPENAI CLIENT
========================= */

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* =========================
   LIMITS
========================= */

const MAX_MESSAGES = 20;
const MAX_TEXT_LENGTH = 12000;
const MAX_IMAGE_LENGTH = 12 * 1024 * 1024;

/* =========================
   HANDLER
========================= */

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed"
    });
  }

  try {

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is missing");

      return res.status(500).json({
        error:
          "مفتاح OpenAI غير موجود في إعدادات Vercel."
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

      if (message.role === "user") {

        if (Array.isArray(message.content)) {

          const content = [];

          for (const item of message.content) {

            if (!item) continue;

            if (
              item.type === "text" ||
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
                  type: "input_text",
                  text
                });
              }

              continue;
            }

            if (
              item.type === "image_url" ||
              item.type === "input_image"
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
        error:
          "لم يتم العثور على محتوى صالح."
      });
    }

    const response =
      await client.responses.create({

        model:
          "gpt-5.6-luna",

        instructions: `
أنت المساعد الرسمي لمنصة "التطور چات".

أجب بالعربية بشكل واضح ومفيد.

استخدم اللهجة العراقية عندما يطلب المستخدم ذلك
أو عندما تكون مناسبة للسياق.

السياق:
- حافظ على سياق المحادثة السابقة.
- اربط السؤال الجديد بالرسائل السابقة.
- افهم الإشارات مثل:
  "هذا"
  "هذه"
  "هو"
  "هي"
  "الصورة"
  "الشيء السابق"
  اعتماداً على سياق المحادثة.

الصور:
- افحص الصورة بعناية قبل الإجابة.
- اقرأ النصوص الموجودة في الصورة قدر الإمكان.
- حلل التفاصيل المهمة المرتبطة بسؤال المستخدم.
- لا تخترع تفاصيل غير واضحة.
- إذا كانت الصورة غير واضحة، أخبر المستخدم بذلك.
- لا تدّعي رؤية شيء غير موجود في الصورة.

الدقة:
- أجب مباشرة.
- لا تكرر السؤال بلا حاجة.
- لا تدّعي تنفيذ إجراء لم تنفذه.
- إذا لم تعرف شيئاً، قل ذلك بوضوح.
`,

        input,

        store: false

      });

    const reply =
      response.output_text ||
      "";

    if (!reply.trim()) {

      console.error(
        "OpenAI returned no text:",
        response
      );

      return res.status(500).json({
        error:
          "لم يتم استلام رد من الذكاء الاصطناعي."
      });
    }

    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    return res.status(200).json({
      reply
    });

  } catch (error) {

    console.error(
      "=============================="
    );

    console.error(
      "OPENAI ERROR"
    );

    console.error(
      "Status:",
      error?.status
    );

    console.error(
      "Code:",
      error?.code
    );

    console.error(
      "Type:",
      error?.type
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Param:",
      error?.param
    );

    console.error(
      "Full Error:",
      error
    );

    console.error(
      "=============================="
    );

    const status =
      Number(error?.status) || 500;

    const code =
      error?.code || "";

    const type =
      error?.type || "";

    const message =
      error?.message ||
      "حدث خطأ أثناء معالجة الطلب.";

    if (
      status === 429 &&
      (
        code === "rate_limit_exceeded" ||
        type === "rate_limit_error"
      )
    ) {

      return res.status(429).json({
        error:
          "تم الوصول إلى حد الطلبات المؤقت. انتظر قليلاً ثم حاول مرة ثانية.",
        error_type:
          "rate_limit",
        debug:
          message
      });
    }

    if (
      status === 429 &&
      (
        code === "insufficient_quota" ||
        code === "billing_hard_limit_reached" ||
        code === "credit_balance_exhausted"
      )
    ) {

      return res.status(429).json({
        error:
          "رصيد استخدام OpenAI API غير كافٍ أو تم الوصول إلى حد الإنفاق.",
        error_type:
          "quota",
        debug:
          message
      });
    }

    if (status === 401) {

      return res.status(401).json({
        error:
          "مفتاح OpenAI API غير صالح أو غير صحيح.",
        error_type:
          "authentication",
        debug:
          message
      });
    }

    if (status === 403) {

      return res.status(403).json({
        error:
          "مفتاح OpenAI لا يملك صلاحية استخدام هذا النموذج أو الخدمة.",
        error_type:
          "permission",
        debug:
          message
      });
    }

    if (status === 404) {

      return res.status(404).json({
        error:
          "النموذج المطلوب غير متاح بهذا الاسم أو غير متاح لهذا الحساب.",
        error_type:
          "model",
        debug:
          message
      });
    }

    return res.status(
      status >= 400
        ? status
        : 500
    ).json({
      error:
        "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.",
      error_type:
        type ||
        code ||
        "unknown",
      debug:
        message
    });
  }
}
