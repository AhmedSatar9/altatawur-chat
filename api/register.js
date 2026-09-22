import { createClient } from "@supabase/supabase-js";

// ======================================================
// ENVIRONMENT
// ======================================================

const SUPABASE_URL =
    process.env.SUPABASE_URL;

const SUPABASE_PUBLISHABLE_KEY =
    process.env.SUPABASE_PUBLISHABLE_KEY;

const SUPABASE_SECRET_KEY =
    process.env.SUPABASE_SECRET_KEY;


// ======================================================
// CLIENTS
// ======================================================

const supabaseAuth =
    createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false
            }
        }
    );

const supabaseAdmin =
    createClient(
        SUPABASE_URL,
        SUPABASE_SECRET_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false
            }
        }
    );


// ======================================================
// HANDLER
// ======================================================

export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method Not Allowed"
        });

    }

    try {

        // ==================================================
        // ENVIRONMENT CHECK
        // ==================================================

        if (
            !SUPABASE_URL ||
            !SUPABASE_PUBLISHABLE_KEY ||
            !SUPABASE_SECRET_KEY
        ) {

            return res.status(500).json({
                error:
                    "إعدادات Supabase غير مكتملة."
            });

        }


        // ==================================================
        // BODY
        // ==================================================

        const body =
            req.body || {};

        const username =
            typeof body.username === "string"
                ? body.username.trim()
                : "";

        const email =
            typeof body.email === "string"
                ? body.email.trim().toLowerCase()
                : "";

        const password =
            typeof body.password === "string"
                ? body.password
                : "";


        // ==================================================
        // VALIDATION
        // ==================================================

        if (!username) {

            return res.status(400).json({
                error:
                    "أدخل اسم المستخدم."
            });

        }

        if (
            username.length < 2 ||
            username.length > 30
        ) {

            return res.status(400).json({
                error:
                    "اسم المستخدم يجب أن يكون بين حرفين و30 حرفاً."
            });

        }

        if (!email) {

            return res.status(400).json({
                error:
                    "أدخل البريد الإلكتروني."
            });

        }

        if (!password) {

            return res.status(400).json({
                error:
                    "أدخل كلمة المرور."
            });

        }

        if (password.length < 8) {

            return res.status(400).json({
                error:
                    "كلمة المرور يجب أن تكون 8 أحرف على الأقل."
            });

        }


        // ==================================================
        // SIGN UP
        // ==================================================

        const redirectUrl =
            `${req.headers.origin || ""}/login.html?confirmed=true`;

        const {
            data,
            error
        } =
            await supabaseAuth.auth.signUp({

                email,

                password,

                options: {
                    emailRedirectTo:
                        redirectUrl,

                    data: {
                        username
                    }
                }

            });


        if (error) {

            console.error(
                "SUPABASE REGISTER ERROR:",
                error
            );

            const message =
                String(
                    error.message || ""
                ).toLowerCase();

            if (
                message.includes(
                    "already registered"
                ) ||
                message.includes(
                    "already exists"
                )
            ) {

                return res.status(409).json({
                    error:
                        "هذا البريد الإلكتروني مسجل مسبقاً."
                });

            }

            return res.status(400).json({
                error:
                    error.message ||
                    "تعذر إنشاء الحساب."
            });

        }


        const user =
            data?.user;


        if (!user?.id) {

            return res.status(500).json({
                error:
                    "تم إنشاء الحساب لكن لم يتم استلام بيانات المستخدم."
            });

        }


        // ==================================================
        // PROFILE
        // ==================================================

        /*
         * نحفظ بيانات الملف الشخصي باستخدام
         * مفتاح السيرفر السري.
         *
         * هذا لا يكشف المفتاح السري للمستخدم.
         */

        const {
            error: profileError
        } =
            await supabaseAdmin
                .from("profiles")
                .upsert(
                    {
                        id:
                            user.id,

                        username:
                            username,

                        email:
                            email
                    },
                    {
                        onConflict:
                            "id"
                    }
                );


        if (profileError) {

            console.error(
                "PROFILE CREATE ERROR:",
                profileError
            );

            /*
             * الحساب نفسه تم إنشاؤه.
             * لكن ملف profile فشل.
             *
             * لا نحذف المستخدم هنا حتى لا نسبب
             * حالة غير متوقعة مع رسالة التأكيد.
             */

            return res.status(500).json({
                error:
                    "تم إنشاء الحساب، لكن تعذر حفظ بيانات الملف الشخصي."
            });

        }


        // ==================================================
        // SUCCESS
        // ==================================================

        return res.status(200).json({

            success:
                true,

            message:
                "تم إنشاء الحساب بنجاح.",

            user_id:
                user.id,

            email_confirmation_required:
                !data?.session

        });

    } catch (error) {

        console.error(
            "REGISTER API ERROR:",
            error
        );

        return res.status(500).json({
            error:
                "حدث خطأ أثناء إنشاء الحساب."
        });

    }

}
