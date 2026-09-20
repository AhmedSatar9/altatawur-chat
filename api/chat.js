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
/*
  Rate Limit
  10 طلبات لكل IP خلال 60 ثانية
*/
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 1000;
/* =========================
   SIMPLE RATE LIMIT STORE
========================= */
const rateLimitStore =
  globalThis.__altatawurRateLimit ||
  new Map();
globalThis.__altatawurRateLimit =
  rateLimitStore;
/* =========================
   GET CLIENT IP
========================= */
function getClientIP(req) {
  const forwarded =
    req.headers["x-forwarded-for"];
  if (forwarded) {
    return String(
      forwarded
    )
      .split(",")[0]
      .trim();
  }
  return (
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}
/* =========================
   RATE LIMIT
========================= */
function checkRateLimit(ip) {
  const now =
    Date.now();
  const record =
    rateLimitStore.get(ip);
  if (!record) {
    rateLimitStore.set(ip, {
      count: 1,
      start: now
    });
    return {
      allowed: true
    };
  }
  /*
    انتهت الدقيقة
  */
  if (
    now - record.start >=
    RATE_WINDOW
  ) {
    rateLimitStore.set(ip, {
      count: 1,
      start: now
    });
    return {
      allowed: true
    };
  }
  /*
    تجاوز الحد
  */
  if (
    record.count >=
    RATE_LIMIT
  ) {
    const retryAfter =
      Math.ceil(
        (
          RATE_WINDOW -
          (now - record.start)
        ) / 1000
      );
    return {
      allowed: false,
      retryAfter
    };
  }
  record.count++;
  return {
    allowed: true
  };
}
/* =========================
   CLEAN RATE LIMIT STORE
========================= */
function cleanupRateLimitStore() {
  const now =
    Date.now();
  for (
    const [ip, record]
    of rateLimitStore.entries()
  ) {
    if (
      now - record.start >
      RATE_WINDOW * 2
    ) {
      rateLimitStore.delete(ip);
    }
  }
}
/* =========================
   VALIDATE MESSAGE
========================= */
function validateMessage(message) {
  if (!message) {
    return false;
  }
  if (
    message.role !== "user" &&
    message.role !== "assistant"
  ) {
    return false;
  }
  return true;
}
/* =========================
   HANDLER
========================= */
export default async function handler(
  req,
  res
) {
  /* =========================
     METHOD
  ========================== */
  if (
    req.method !== "POST"
  ) {
    return res.status(405).json({
      error:
        "Method Not Allowed"
    });
  }
  /* =========================
     SECURITY HEADERS
  ========================== */
  res.setHeader(
    "X-Content-Type-Options",
    "nosniff"
  );
  res.setHeader(
    "X-Frame-Options",
    "DENY"
  );
  res.setHeader(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );
  res.setHeader(
    "Cache-Control",
    "no-store"
  );
  /* =========================
     API KEY
  ========================== */
  if (
    !process.env.OPENAI_API_KEY
  ) {
    console.error(
      "OPENAI_API_KEY is missing"
    );
    return res.status(500).json({
      error:
        "الخدمة غير مهيأة بشكل صحيح."
    });
  }
  /* =========================
     RATE LIMIT
  ========================== */
  const ip =
    getClientIP(req);
  const rate =
    checkRateLimit(ip);
  if (!rate.allowed) {
    res.setHeader(
      "Retry-After",
      String(rate.retryAfter)
    );
    return res.status(429).json({
      error:
        `تم تجاوز عدد الطلبات المسموح بها. حاول بعد ${rate.retryAfter} ثانية.`
    });
  }
  cleanupRateLimitStore();
  try {
    /* =========================
       BODY
    ========================== */
    const messages =
      Array.isArray(
        req.body?.messages
      )
        ? req.body.messages
        : [];
    /* =========================
       MESSAGE LIMIT
    ========================== */
    if (
      !messages.length
    ) {
      return res.status(400).json({
        error:
          "لا توجد رسائل."
      });
    }
    if (
      messages.length >
      100
    ) {
      return res.status(400).json({
        error:
          "عدد الرسائل كبير جداً."
      });
    }
    /* =========================
       VALIDATE
    ========================== */
    for (
      const message
      of messages
    ) {
      if (
        !validateMessage(
          message
        )
      ) {
        return res.status(400).json({
          error:
            "صيغة الرسائل غير صحيحة."
        });
      }
    }
    /* =========================
       RECENT MESSAGES
    ========================== */
    const recentMessages =
      messages.slice(
        -MAX_MESSAGES
      );
    /* =========================
       BUILD INPUT
    ========================== */
    const input = [];
    for (
      const message
      of recentMessages
    ) {
      /* =========================
         USER
      ========================== */
      if (
        message.role === "user"
      ) {
        if (
          Array.isArray(
            message.content
          )
        ) {
          const content = [];
          for (
            const item
            of message.content
          ) {
            if (!item) continue;
            /* TEXT */
            if (
              item.type ===
              "input_text"
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
              if (
                text.trim()
              ) {
                content.push({
                  type:
                    "input_text",
                  text
                });
              }
              continue;
            }
            /* IMAGE */
            if (
              item.type ===
              "input_image"
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
            /* OLD IMAGE FORMAT */
            if (
              item.type ===
              "image_url"
            ) {
              let imageUrl =
                "";
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
          if (
            content.length
          ) {
            input.push({
              role:
                "user",
              content
            });
          }
          continue;
        }
        /* TEXT ONLY */
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
        if (
          text.trim()
        ) {
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
        message.role ===
        "assistant"
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
        if (
          text.trim()
        ) {
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
    if (
      !input.length
    ) {
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
السياق:
- حافظ على سياق المحادثة السابقة.
- اربط الأسئلة الجديدة بالرسائل السابقة.
- افهم الإشارات مثل "هذا" و"هذه" و"هو" و"هي"
  اعتماداً على سياق المحادثة.
- لا تطلب من المستخدم إعادة معلومة موجودة
  بالفعل في السياق.
الصور:
- افحص الصور المرفقة بعناية.
- اقرأ النصوص الموجودة فيها قدر الإمكان.
- حلل التفاصيل المهمة المتعلقة بالسؤال.
- إذا كانت الصورة غير واضحة، اذكر ذلك.
- لا تخترع تفاصيل غير ظاهرة.
- لا تدّعي رؤية شيء غير موجود بالصورة.
الدقة:
- أجب مباشرة.
- لا تكرر السؤال بلا حاجة.
- لا تدّعي تنفيذ إجراء لم تنفذه.
- إذا لم تعرف الإجابة، قل ذلك بوضوح.
`,
        input,
        store:
          false
      });
    /* =========================
       RESPONSE
    ========================== */
    const reply =
      response.output_text ||
      "ما حصلت جواب نصي من النموذج.";
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
        "حدث خطأ أثناء معالجة الطلب. حاول مرة ثانية."
    });
  }
}
