import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "ضع_مفتاحك_هنا") {
  console.warn("ضع OPENAI_API_KEY داخل ملف .env قبل التشغيل.");
}

const app = express();
const port = process.env.PORT || 3000;
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

app.post("/api/chat", async (req, res) => {
  try {
    const messages = Array.isArray(req.body.messages) ? req.body.messages : [];
    if (!messages.length) return res.status(400).json({ error: "لا توجد رسالة." });

    const input = messages.slice(-30).map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "")
    }));

    const response = await client.responses.create({
      model: "gpt-5.5",
      instructions: "أنت المساعد الرسمي لمنصة التطور چات. أجب بالعربية بشكل واضح ومفيد، واستخدم اللهجة العراقية فقط عندما يطلب المستخدم ذلك. لا تدّعي تنفيذ أفعال لم تنفذها.",
      input,
      store: false
    });

    res.json({ reply: response.output_text || "ما حصلت جواب نصي من النموذج." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي." });
  }
});

app.listen(port, () => {
  console.log(`التطور چات يعمل على http://localhost:${port}`);
});
