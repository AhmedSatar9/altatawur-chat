import "dotenv/config";

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();


// ==========================================
// PATH
// ==========================================

const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);


// ==========================================
// JSON
// ==========================================

app.use(
    express.json({
        limit: "1mb"
    })
);


// ==========================================
// STATIC FILES
// ==========================================

app.use(
    express.static(__dirname, {
        index: false
    })
);


// ==========================================
// HEALTH
// ==========================================

app.get(
    "/api/health",
    (req, res) => {

        res.json({
            status: "ok",
            app: "altatawur-chat",
            time: new Date().toISOString()
        });

    }
);


// ==========================================
// LOGIN PAGE
// ==========================================

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


// ==========================================
// LOGIN.HTML
// ==========================================

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


// ==========================================
// MAIN PAGE
// ==========================================

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


// ==========================================
// 404
// ==========================================

app.use(
    (req, res) => {

        res.status(404).send(
            "Page not found"
        );

    }
);


// ==========================================
// SERVER
// ==========================================

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
