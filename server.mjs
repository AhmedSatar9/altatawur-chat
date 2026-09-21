import "dotenv/config";

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();

const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);


app.use(
    express.json({
        limit: "1mb"
    })
);


app.use(
    express.static(__dirname)
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
// MAIN APP
// ==========================================

app.get(
    "*",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );

    }
);


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
