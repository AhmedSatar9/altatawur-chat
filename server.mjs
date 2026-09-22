import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

/*
  التطور چات
  server.mjs

  متوافق مع api/chat.js سواء كان:
  - export default
  - export { handler }
  - export const handler
*/

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 3000;

/* =========================
   MIDDLEWARE
========================= */

app.use(
  express.json({
    limit: "25mb"
  })
);

/* =========================
   CHAT HANDLER
========================= */

let chatHandler;

try {
  const chatModule = await import("./api/chat.js");

  chatHandler =
    chatModule.default ||
    chatModule.handler ||
    chatModule.chatHandler;

  if (typeof chatHandler !== "function") {
    throw new Error(
      "api/chat.js لا يحتوي على handler صالح. يجب أن يكون export default أو export { handler }."
    );
  }

  console.log("✅ CHAT HANDLER LOADED");

} catch (error) {

  console.error("❌ FAILED TO LOAD ./api/chat.js");
  console.error(error);

  chatHandler = async (req, res) => {
    return res.status(500).json({
      error: "تعذر تحميل نظام المحادثة.",
      details:
        process.env.NODE_ENV === "production"
          ? "تحقق من ملف api/chat.js وتصديره."
          : error?.message
    });
  };
}

/* =========================
   MAIN PAGE
========================= */

app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "index.html")
  );
});

/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "altatawur-chat",
    chat_handler: typeof chatHandler === "function"
  });
});

/* =========================
   CHAT API
========================= */

app.post("/api/chat", async (req, res, next) => {

  try {

    return await chatHandler(req, res);

  } catch (error) {

    console.error("❌ CHAT HANDLER ERROR");
    console.error(error);

    if (!res.headersSent) {

      return res.status(500).json({
        error:
          error?.message ||
          "حدث خطأ أثناء معالجة المحادثة."
      });

    }

    return next(error);
  }

});

/* =========================
   STATIC FILES
========================= */

app.use(
  express.static(__dirname)
);

/* =========================
   404
========================= */

app.use((req, res) => {

  if (req.path.startsWith("/api/")) {

    return res.status(404).json({
      error: "API endpoint غير موجود."
    });

  }

  return res.status(404).send("Page not found");

});

/* =========================
   ERROR HANDLER
========================= */

app.use((error, req, res, next) => {

  console.error("❌ SERVER ERROR");
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    error: "حدث خطأ داخلي في الخادم."
  });

});

/* =========================
   START SERVER
========================= */

app.listen(port, () => {

  console.log(
    `✅ التطور چات يعمل على المنفذ ${port}`
  );

});
