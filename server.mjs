import "dotenv/config";

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import chatHandler from "./api/chat.js";
import registerHandler from "./api/register.js";

const app = express();


// ======================================================
// PATH
// ======================================================

const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);


// ======================================================
// JSON
// ======================================================

app.use(
    express.json({
        limit: "1mb"
    })
);


// ======================================================
// STATIC
// ======================================================

app.use(
    express.static(
        __dirname,
        {
            index: false
        }
    )
);


// ======================================================
// HEALTH
// ======================================================

app.get(
    "/api/health",
    (req, res) => {

        res.status(200).json({

            status:
                "ok",

            app:
                "altatawur-chat",

            time:
                new Date().toISOString()

        });

    }
);


// ======================================================
// REGISTER
// ======================================================

app.post(
    "/api/register",
    registerHandler
);


// ======================================================
// CHAT
// ======================================================

app.post(
    "/api/chat",
    chatHandler
);


// ======================================================
// LOGIN
// ======================================================

app.get(
    "/login",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "login.html"
            )
        );

    }
);


app.get(
    "/login.html",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "login.html"
            )
        );

    }
);


app.get(
    "/login.js",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "login.js"
            )
        );

    }
);


// ======================================================
// HOME
// ======================================================

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );

    }
);


// ======================================================
// 404
// ======================================================

app.use(
    (req, res) => {

        res.status(404).send(
            "Page not found"
        );

    }
);


// ======================================================
// ERROR
// ======================================================

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "EXPRESS ERROR:",
            error
        );

        if (res.headersSent) {
            return next(error);
        }

        res.status(500).json({
            error:
                "حدث خطأ داخلي في الخادم."
        });

    }
);


// ======================================================
// SERVER
// ======================================================

const PORT =
    process.env.PORT || 3000;


app.listen(
    PORT,
    () => {

        console.log(
            `التطور چات يعمل على http://localhost:${PORT}`
        );

    }
);
