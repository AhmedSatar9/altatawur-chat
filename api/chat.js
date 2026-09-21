import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";


// ==========================================
// OPENAI
// ==========================================

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


// ==========================================
// SUPABASE ADMIN
// ==========================================

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);


// ==========================================
// API HANDLER
// ==========================================

export default async function handler(req, res) {

    // ======================================
    // METHOD
    // ======================================

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method Not Allowed"
        });

    }


    try {

        // ==================================
        // CHECK AUTHORIZATION
        // ==================================

        const authorization =
            req.headers.authorization;


        if (
            !authorization ||
            !authorization.startsWith("Bearer ")
        ) {

            return res.status(401).json({
                error: "يجب تسجيل الدخول أولاً."
            });

        }


        const token =
            authorization.substring(7);


        // ==================================
        // VERIFY SUPABASE USER
        // ==================================

        const {
            data: userData,
            error: userError
        } =
            await supabaseAdmin.auth.getUser(token);


        if (
            userError ||
            !userData?.user
        ) {

            console.error(
                "SUPABASE AUTH ERROR:",
                userError
            );

            return res.status(401).json({
                error: "جلسة تسجيل الدخول غير صالحة."
            });

        }


        const user =
            userData.user;


        // ==================================
        // REQUEST BODY
        // ==================================

        const {
            messages
        } = req.body || {};


        if (
            !Array.isArray(messages) ||
            messages.length === 0
        ) {

            return res.status(400).json({
                error: "لم يتم إرسال أي رسالة."
            });

        }


        // ==================================
        // CLEAN MESSAGES
        // ==================================

        const safeMessages =
            messages
                .slice(-30)
                .map((message) => {

                    const role =
                        message?.role === "assistant"
                            ? "assistant"
                            : "user";


                    const content =
                        String(
                            message?.content || ""
                        ).trim();


                    return {
                        role,
                        content: content.slice(0, 12000)
                    };

                })
                .filter(
                    message =>
                        message.content.length > 0
                );


        if (
            safeMessages.length === 0
        ) {

            return res.status(400).json({
                error: "الرسالة فارغة."
            });

        }


        // ==================================
        // OPENAI REQUEST
        // ==================================

        const response =
            await openai.responses.create({

                model:
                    process.env.OPENAI_MODEL ||
                    "gpt-5.6-luna",


                instructions: `
أنت المساعد الذكي الرسمي لمنصة "التطور چات".

أجب باللغة العربية عندما يكتب المستخدم بالعربية.

إذا كان المستخدم يتحدث باللهجة العراقية، يمكنك الرد باللهجة العراقية بشكل طبيعي.

كن واضحاً ومفيداً ومباشراً.

لا تدّعي تنفيذ أي شيء لم تنفذه فعلياً.

لا تقل إنك أجريت بحثاً أو استخدمت أداة إذا لم تفعل ذلك.

حافظ على سياق المحادثة السابقة عندما يكون ذلك مناسباً.

إذا لم تكن متأكداً من معلومة، وضّح ذلك بدلاً من اختلاق المعلومات.
`,


                input:
                    safeMessages.map(
                        (message) => ({
                            role: message.role,
                            content: message.content
                        })
                    )

            });


        // ==================================
        // GET ANSWER
        // ==================================

        const answer =
            response.output_text?.trim() ||
            "عذراً، لم أتمكن من إنشاء رد.";


        // ==================================
        // SUCCESS RESPONSE
        // ==================================

        return res.status(200).json({

            success: true,

            message: answer,

            user: {
                id: user.id,
                email: user.email
            }

        });


    } catch (error) {

        // ==================================
        // SERVER ERROR
        // ==================================

        console.error(
            "CHAT API ERROR:",
            error
        );


        return res.status(500).json({

            error:
                "حدث خطأ أثناء الاتصال بالمساعد الذكي."

        });

    }

}
