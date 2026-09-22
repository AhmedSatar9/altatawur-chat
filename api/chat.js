const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==================================================
// إعدادات عامة
// ==================================================

const MODEL = "gpt-5.6-luna";

const MAX_MESSAGES = 20;
const MAX_TEXT_LENGTH = 12000;
const MAX_IMAGE_SIZE = 12 * 1024 * 1024;

// الحد الأقصى للإجابة
const MAX_OUTPUT_TOKENS = 1200;

// ==================================================
// Helpers
// ==================================================

function json(res, status, data) {
  res.status(status);
  res.setHeader(
    "Content-Type",
    "application/json; charset=utf-8"
  );

  return res.end(JSON.stringify(data));
}

function getErrorMessage(error) {
  if (!error) return "";

  if (typeof error.message === "string") {
    return error.message;
  }

  return String(error);
}

function getRetryAfterSeconds(error) {
  const headers = error?.headers;

  if (!headers) {
    return null;
  }

  try {
    const retryAfter = headers.get?.("retry-after");

    if (retryAfter) {
      const seconds = Number(retryAfter);

      if (
        Number.isFinite(seconds) &&
        seconds > 0
      ) {
        return Math.ceil(seconds);
      }
    }

    const retryAfterMs =
      headers.get?.("retry-after-ms");

    if (retryAfterMs) {
      const milliseconds = Number(
        retryAfterMs
      );

      if (
        Number.isFinite(milliseconds) &&
        milliseconds > 0
      ) {
        return Math.ceil(
          milliseconds / 1000
        );
      }
    }
  } catch (error) {
    console.error(
      "RETRY HEADER ERROR:",
      error
    );
  }

  return null;
}

// ==================================================
// استخراج النص
// ==================================================

function getTextFromMessage(message) {
  if (!message) {
    return "";
  }

  if (
    typeof message.content === "string"
  ) {
    return message.content;
  }

  if (
    Array.isArray(message.content)
  ) {
    return message.content
      .filter((item) => {
        return (
          item &&
          (
            item.type === "text" ||
            item.type === "input_text"
          )
        );
      })
      .map((item) => item.text || "")
      .join("\n");
  }

  if (
    typeof message.text === "string"
  ) {
    return message.text;
  }

  return "";
}

// ==================================================
// Role
// ==================================================

function normalizeRole(role) {
  if (role === "assistant") {
    return "assistant";
  }

  if (role === "system") {
    return "system";
  }

  return "user";
}

// ==================================================
// Images
// ==================================================

function isDataImageUrl(value) {
  return (
    typeof value === "string" &&
    value.startsWith("data:image/")
  );
}

function getImageSizeFromDataUrl(dataUrl) {
  if (!isDataImageUrl(dataUrl)) {
    return 0;
  }

  const commaIndex =
    dataUrl.indexOf(",");

  if (commaIndex === -1) {
    return 0;
  }

  const base64 =
    dataUrl.slice(commaIndex + 1);

  return Math.floor(
    (base64.length * 3) / 4
  );
}

// ==================================================
// بناء Input للـ Responses API
// ==================================================

function buildInput(messages) {
  const input = [];

  for (const message of messages) {
    if (!message) {
      continue;
    }

    const role = normalizeRole(
      message.role
    );

    const content = [];

    // ----------------------------------------------
    // النص
    // ----------------------------------------------

    const text =
      getTextFromMessage(message);

    if (text.trim()) {
      content.push({
        type: "input_text",
        text: text.trim(),
      });
    }

    // ----------------------------------------------
    // الصور
    // ----------------------------------------------

    let images = [];

    if (
      Array.isArray(message.images)
    ) {
      images = [
        ...message.images
      ];
    }

    if (message.image) {
      images.push(
        message.image
      );
    }

    // دعم الصور داخل content
    if (
      Array.isArray(message.content)
    ) {
      for (
        const item of message.content
      ) {
        if (!item) {
          continue;
        }

        if (
          item.type === "input_image"
        ) {
          if (item.image_url) {
            images.push(
              item.image_url
            );
          }
        }

        if (
          item.type === "image_url" &&
          item.image_url
        ) {
          if (
            typeof item.image_url ===
            "string"
          ) {
            images.push(
              item.image_url
            );
          } else if (
            item.image_url.url
          ) {
            images.push(
              item.image_url.url
            );
          }
        }
      }
    }

    // ----------------------------------------------
    // إضافة الصور
    // ----------------------------------------------

    for (
      const image of images
    ) {
      if (!image) {
        continue;
      }

      let imageUrl = image;

      if (
        typeof image === "object" &&
        image.url
      ) {
        imageUrl = image.url;
      }

      if (
        typeof imageUrl !== "string"
      ) {
        continue;
      }

      if (
        imageUrl.startsWith(
          "http://"
        ) ||
        imageUrl.startsWith(
          "https://"
        ) ||
        imageUrl.startsWith(
          "data:image/"
        )
      ) {
        content.push({
          type: "input_image",
          image_url: imageUrl,
        });
      }
    }

    // لا نرسل رسالة فارغة
    if (content.length === 0) {
      continue;
    }

    input.push({
      role,
      content,
    });
  }

  return input;
}

// ==================================================
// Handler
// ==================================================

async function handler(req, res) {

  // ==================================================
  // CORS
  // ==================================================

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
    "Content-Type, Authorization"
  );

  // ==================================================
  // OPTIONS
  // ==================================================

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // ==================================================
  // POST فقط
  // ==================================================

  if (req.method !== "POST") {
    return json(res, 405, {
      error: "Method not allowed",
    });
  }

  // ==================================================
  // OpenAI Key
  // ==================================================

  if (
    !process.env.OPENAI_API_KEY
  ) {
    console.error(
      "OPENAI_API_KEY is missing."
    );

    return json(res, 500, {
      error:
        "خدمة الذكاء الاصطناعي غير مهيأة حالياً.",
      code:
        "OPENAI_KEY_MISSING",
    });
  }

  try {

    // ==================================================
    // قراءة Body
    // ==================================================

    let body;

    try {
      body =
        typeof req.body === "string"
          ? JSON.parse(req.body)
          : req.body || {};
    } catch (parseError) {

      console.error(
        "BODY PARSE ERROR:",
        parseError
      );

      return json(res, 400, {
        error:
          "بيانات الطلب غير صالحة.",
        code:
          "INVALID_JSON",
      });
    }

    // ==================================================
    // استخراج الرسائل
    // ==================================================

    let messages = [];

    if (
      Array.isArray(body.messages)
    ) {
      messages =
        body.messages;
    }

    else if (body.message) {

      messages = [
        {
          role: "user",

          content:
            typeof body.message ===
            "string"
              ? body.message
              : body.message.content ||
                "",

          image:
            body.image || null,
        },
      ];
    }

    else if (body.input) {

      messages = [
        {
          role: "user",

          content:
            typeof body.input ===
            "string"
              ? body.input
              : "",
        },
      ];
    }

    // ==================================================
    // التحقق من الرسائل
    // ==================================================

    if (
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      return json(res, 400, {
        error:
          "لم يتم إرسال رسالة.",
        code:
          "EMPTY_MESSAGES",
      });
    }

    // آخر 20 رسالة
    messages =
      messages.slice(
        -MAX_MESSAGES
      );

    // ==================================================
    // فحص الحجم
    // ==================================================

    let totalTextLength = 0;
    let totalImageSize = 0;

    for (
      const message of messages
    ) {

      totalTextLength +=
        getTextFromMessage(
          message
        ).length;

      // ----------------------------------------------
      // images[]
      // ----------------------------------------------

      if (
        Array.isArray(
          message.images
        )
      ) {

        for (
          const image of
          message.images
        ) {
          totalImageSize +=
            getImageSizeFromDataUrl(
              image
            );
        }
      }

      // ----------------------------------------------
      // image
      // ----------------------------------------------

      if (
        message.image
      ) {
        totalImageSize +=
          getImageSizeFromDataUrl(
            message.image
          );
      }

      // ----------------------------------------------
      // content images
      // ----------------------------------------------

      if (
        Array.isArray(
          message.content
        )
      ) {

        for (
          const item of
          message.content
        ) {

          if (!item) {
            continue;
          }

          let imageUrl = null;

          if (
            item.type ===
            "input_image"
          ) {
            imageUrl =
              item.image_url;
          }

          if (
            item.type ===
              "image_url" &&
            item.image_url
          ) {

            imageUrl =
              typeof item.image_url ===
              "string"
                ? item.image_url
                : item.image_url.url;
          }

          if (imageUrl) {
            totalImageSize +=
              getImageSizeFromDataUrl(
                imageUrl
              );
          }
        }
      }
    }

    // ==================================================
    // النص طويل جداً
    // ==================================================

    if (
      totalTextLength >
      MAX_TEXT_LENGTH
    ) {
      return json(res, 413, {
        error:
          "الرسالة طويلة جداً. اختصر النص وحاول مرة ثانية.",
        code:
          "TEXT_TOO_LONG",
        maxCharacters:
          MAX_TEXT_LENGTH,
      });
    }

    // ==================================================
    // الصور كبيرة جداً
    // ==================================================

    if (
      totalImageSize >
      MAX_IMAGE_SIZE
    ) {
      return json(res, 413, {
        error:
          "حجم الصور كبير جداً. أرسل صوراً أصغر.",
        code:
          "IMAGE_TOO_LARGE",
        maxBytes:
          MAX_IMAGE_SIZE,
      });
    }

    // ==================================================
    // بناء Input
    // ==================================================

    const input =
      buildInput(messages);

    if (
      !input.length
    ) {
      return json(res, 400, {
        error:
          "الرسالة فارغة.",
        code:
          "EMPTY_INPUT",
      });
    }

    console.log(
      "OPENAI REQUEST:",
      JSON.stringify({
        model: MODEL,
        messages:
          input.length,
        textLength:
          totalTextLength,
      })
    );

    // ==================================================
    // OpenAI Responses API
    // ==================================================

    const response =
      await openai.responses.create({
        model: MODEL,
        input,

        max_output_tokens:
          MAX_OUTPUT_TOKENS,
      });

    // ==================================================
    // استخراج الرد
    // ==================================================

    let reply = "";

    if (
      typeof response.output_text ===
      "string"
    ) {
      reply =
        response.output_text.trim();
    }

    // Fallback
    if (
      !reply &&
      Array.isArray(
        response.output
      )
    ) {

      for (
        const item of
        response.output
      ) {

        if (!item) {
          continue;
        }

        if (
          item.type ===
            "message" &&
          Array.isArray(
            item.content
          )
        ) {

          for (
            const content of
            item.content
          ) {

            if (
              content &&
              (
                content.type ===
                  "output_text" ||
                content.type ===
                  "text"
              )
            ) {

              if (
                content.text
              ) {
                reply +=
                  content.text;
              }
            }
          }
        }
      }

      reply =
        reply.trim();
    }

    // ==================================================
    // رد فارغ
    // ==================================================

    if (!reply) {

      console.error(
        "OPENAI EMPTY RESPONSE:",
        response
      );

      return json(res, 502, {
        error:
          "وصلت استجابة فارغة من الذكاء الاصطناعي.",
        code:
          "EMPTY_OPENAI_RESPONSE",
      });
    }

    // ==================================================
    // نجاح
    // ==================================================

    console.log(
      "OPENAI SUCCESS"
    );

    return json(res, 200, {
      reply,
    });

  } catch (error) {

    // ==================================================
    // تسجيل الخطأ
    // ==================================================

    const status =
      error?.status;

    const message =
      getErrorMessage(error);

    console.error(
      "OPENAI ERROR:",
      message
    );

    // ==================================================
    // 429
    // ==================================================

    if (
      status === 429 ||
      error?.code ===
        "rate_limit_exceeded" ||
      error?.type === "tokens"
    ) {

      const retryAfter =
        getRetryAfterSeconds(
          error
        );

      let userMessage =
        "حالياً صار ضغط على خدمة الذكاء الاصطناعي. حاول مرة ثانية بعد قليل.";

      if (
        retryAfter
      ) {

        const minutes =
          Math.ceil(
            retryAfter / 60
          );

        if (
          minutes >= 1
        ) {

          userMessage =
            `الخدمة وصلت إلى حد الاستخدام المؤقت. حاول مرة ثانية بعد حوالي ${minutes} دقيقة.`;

        } else {

          userMessage =
            "الخدمة وصلت إلى حد الاستخدام المؤقت. حاول مرة ثانية بعد قليل.";
        }
      }

      return json(res, 429, {
        error:
          userMessage,

        code:
          "OPENAI_RATE_LIMIT",

        retryAfterSeconds:
          retryAfter || null,
      });
    }

    // ==================================================
    // 401
    // ==================================================

    if (
      status === 401
    ) {

      return json(res, 401, {
        error:
          "مفتاح خدمة الذكاء الاصطناعي غير صالح.",

        code:
          "OPENAI_UNAUTHORIZED",
      });
    }

    // ==================================================
    // 403
    // ==================================================

    if (
      status === 403
    ) {

      return json(res, 403, {
        error:
          "لا توجد صلاحية لاستخدام خدمة الذكاء الاصطناعي بهذا المفتاح.",

        code:
          "OPENAI_FORBIDDEN",
      });
    }

    // ==================================================
    // 404
    // ==================================================

    if (
      status === 404
    ) {

      return json(res, 404, {
        error:
          "موديل الذكاء الاصطناعي غير متوفر حالياً.",

        code:
          "OPENAI_MODEL_NOT_FOUND",
      });
    }

    // ==================================================
    // أخطاء Client
    // ==================================================

    if (
      status &&
      status >= 400 &&
      status < 500
    ) {

      return json(
        res,
        status,
        {
          error:
            "تعذر تنفيذ طلب الذكاء الاصطناعي.",

          code:
            "OPENAI_CLIENT_ERROR",
        }
      );
    }

    // ==================================================
    // خطأ داخلي
    // ==================================================

    return json(res, 500, {
      error:
        "حدث خطأ أثناء الاتصال بالمساعد.",

      code:
        "OPENAI_SERVER_ERROR",
    });
  }
}

// ==================================================
// CommonJS exports
// ==================================================

module.exports = handler;
module.exports.handler = handler;
module.exports.chatHandler = handler;
