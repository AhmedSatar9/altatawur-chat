import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


const supabaseAdmin =
    createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SECRET_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );


export default async function handler(
    req,
    res
) {

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
        // AUTH HEADER
        // ==================================

        const authorization =
            req.headers.authorization;


        if (
            !authorization ||
            !authorization.startsWith(
                "Bearer "
            )
        ) {

            return res.status(401).json({
                error:
                    "يجب تسجيل الدخول أولاً."
            });

        }


        const token =
            authorization.replace(
                "Bearer ",
                ""
            );


        // ==================================
        // VERIFY USER
        // ==================================

        const {
            data: userData,
            error: userError
        } =
            await supabaseAdmin.auth.getUser(
                token
            );


        if (
            userError ||
            !userData?.user
        ) {

            return res.status(401).json({
                error:
                    "جلسة تسجيل الدخول غير صالحة."
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
                error:
                    "لم يتم إرسال أي رسالة."
            });

        }


        // ==================================
        // LIMIT MESSAGE SIZE
        // ==================================

        const safeMessages =
            messages
                .slice(-30)
                .map((message) => ({

                    role:
                        message.role ===
                        "assistant"
                            ? "assistant"
                            : "user",

                    content:
                        String(
                            message.content || ""
                        ).slice(
                            0,
                            12000
                        )

                }))
                .filter(
                    message =>
                        message.content.trim()
                );


        if (
            safeMessages.length === 0
        ) {

            return res.status(400).json({
                error:
                    "الرسالة فارغة."
            });

        }


        // ==================================
        // OPENAI
        // ==================================

        const response =
            await openai.responses.create({

                model:
                    process.env.OPENAI_MODEL ||
                    "gpt-5.6-luna",

                instructions:
                    `
أنت المساعد الذكي الرسمي لمنصة "التطور چات".

أجب باللغة العربية عندما يكتب المستخدم بالعربية.
يمكنك استخدام اللهجة العراقية بشكل طبيعي عندما يناسب سياق المستخدم.

كن واضحاً ومفيداً ومباشراً.
لا تدّعي تنفيذ أشياء لم تنفذها.
`,

                input:
                    safeMessages.map(
                        message => ({
                            role:
                                message.role,
                            content:
                                message.content
                        })
                    )

            });


        const answer =
            response.output_text ||
            "عذراً، لم أتمكن من إنشاء رد.";


        // ==================================
        // RESPONSE
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

        console.error(
            "CHAT API ERROR:",
            error
        );


        return res.status(500).json({

            error:
                "حدث خطأ داخلي في الخادم. حاول مرة أخرى."

        });

    }

}
