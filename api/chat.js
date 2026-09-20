export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed"
    });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: "الرسائل غير صحيحة."
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },

        body: JSON.stringify({
          model: "gpt-5.1",
          messages: messages,
          temperature: 0.7
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI Error:", data);

      return res.status(response.status).json({
        error: data?.error?.message || "حدث خطأ من OpenAI."
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "لم أستطع إنشاء إجابة.";

    return res.status(200).json({
      reply: reply
    });

  } catch (error) {

    console.error("Server Error:", error);

    return res.status(500).json({
      error: "حدث خطأ في الخادم."
    });
  }
}
