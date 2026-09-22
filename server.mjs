import express from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

/*
  التطور چات
  server.mjs

  Main server for:
  - index.html
  - login.html
  - static assets
  - /api/chat
  - /api/health
*/

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 3000;

/* =====================================================
   BASIC CONFIG
===================================================== */

app.disable("x-powered-by");

app.use(
  express.json({
    limit: "25mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "25mb"
  })
);

/* =====================================================
   FILE PATHS
===================================================== */

const indexFile = path.join(__dirname, "index.html");
const loginFile = path.join(__dirname, "login.html");

console.log("========================================");
console.log("ALTATAWUR CHAT SERVER");
console.log("========================================");
console.log("SERVER DIRECTORY:", __dirname);
console.log("INDEX:", indexFile);
console.log("LOGIN:", loginFile);
console.log("INDEX EXISTS:", fs.existsSync(indexFile));
console.log("LOGIN EXISTS:", fs.existsSync(loginFile));
console.log("========================================");

/* =====================================================
   LOAD CHAT HANDLER
===================================================== */

let chatHandler = null;

try {
  const chatModule = await import("./api/chat.js");

  chatHandler =
    chatModule.default ||
    chatModule.handler ||
    chatModule.chatHandler;

  if (typeof chatHandler !== "function") {
    throw new Error(
      "api/chat.js لا يحتوي على handler صالح."
    );
  }

  console.log("✅ CHAT HANDLER LOADED");

} catch (error) {

  console.error("❌ FAILED TO LOAD ./api/chat.js");
  console.error(error);

  chatHandler = async (req, res) => {

    if (res.headersSent) {
      return;
    }

    return res.status(500).json({
      error: "تعذر تحميل نظام المحادثة.",
      details:
        process.env.NODE_ENV === "production"
          ? "تحقق من ملف api/chat.js وتصديره."
          : error?.message
    });

  };
}

/* =====================================================
   HOME PAGE
===================================================== */

app.get("/", (req, res) => {

  if (!fs.existsSync(indexFile)) {

    console.error("❌ index.html NOT FOUND");

    return res.status(500).send(
      "index.html غير موجود في جذر المشروع."
    );
  }

  return res.sendFile(indexFile);

});

/* =====================================================
   LOGIN PAGE
===================================================== */

app.get("/login.html", (req, res) => {

  console.log("➡️ LOGIN PAGE REQUESTED");

  if (!fs.existsSync(loginFile)) {

    console.error("❌ login.html NOT FOUND");
    console.error("Expected:", loginFile);

    return res.status(404).send(
      "login.html غير موجود في جذر المشروع."
    );
  }

  return res.sendFile(loginFile);

});

/* =====================================================
   OPTIONAL LOGIN ROUTE
===================================================== */

app.get("/login", (req, res) => {

  if (!fs.existsSync(loginFile)) {

    return res.status(404).send(
      "login.html غير موجود."
    );
  }

  return res.sendFile(loginFile);

});

/* =====================================================
   HEALTH CHECK
===================================================== */

app.get("/api/health", (req, res) => {

  return res.status(200).json({
    ok: true,
    service: "altatawur-chat",
    server: "express",
    chat_handler: typeof chatHandler === "function",
    index_exists: fs.existsSync(indexFile),
    login_exists: fs.existsSync(loginFile)
  });

});

/* =====================================================
   CHAT API
===================================================== */

app.post("/api/chat", async (req, res, next) => {

  try {

    if (typeof chatHandler !== "function") {

      return res.status(500).json({
        error: "Chat handler غير متوفر."
      });

    }

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

/* =====================================================
   STATIC FILES
===================================================== */

app.use(
  express.static(__dirname, {
    index: false,
    fallthrough: true,
    maxAge: "1h"
  })
);

/* =====================================================
   EXPLICIT STATIC FILE ROUTES
===================================================== */

app.get("/app.js", (req, res) => {

  const file = path.join(__dirname, "app.js");

  if (!fs.existsSync(file)) {
    return res.status(404).send("app.js غير موجود.");
  }

  return res.type("application/javascript").sendFile(file);

});

app.get("/login.js", (req, res) => {

  const file = path.join(__dirname, "login.js");

  if (!fs.existsSync(file)) {
    return res.status(404).send("login.js غير موجود.");
  }

  return res
    .type("application/javascript")
    .sendFile(file);

});

app.get("/style.css", (req, res) => {

  const file = path.join(__dirname, "style.css");

  if (!fs.existsSync(file)) {
    return res.status(404).send("style.css غير موجود.");
  }

  return res
    .type("text/css")
    .sendFile(file);

});

/* =====================================================
   404 HANDLER
===================================================== */

app.use((req, res) => {

  console.error(
    `❌ 404 NOT FOUND: ${req.method} ${req.originalUrl}`
  );

  if (req.path.startsWith("/api/")) {

    return res.status(404).json({
      error: "API endpoint غير موجود.",
      path: req.path
    });

  }

  return res.status(404).send(
    "Page not found"
  );

});

/* =====================================================
   ERROR HANDLER
===================================================== */

app.use((error, req, res, next) => {

  console.error("❌ SERVER ERROR");
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    error:
      error?.message ||
      "حدث خطأ داخلي في الخادم."
  });

});

/* =====================================================
   START SERVER
===================================================== */

app.listen(port, () => {

  console.log(
    `✅ التطور چات يعمل على المنفذ ${port}`
  );

  console.log(
    `🌐 PORT: ${port}`
  );

});
