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
// HANDLER
// ======================================================
export default async function handler(req, res) {
    // ==================================================
    // METHOD
    // ==================================================
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Method Not Allowed"
        });
    }
    try {
        // ==================================================
        // ENVIRONMENT CHECK
        // ==================================================
        if (!SUPABASE_URL) {
            console.error(
                "REGISTER ERROR: SUPABASE_URL missing"
            );
            return res.status(500).json({
                success: false,
                error:
                    "SUPABASE_URL غير موجود في إعدادات Vercel."
            });
        }
        if (!SUPABASE_PUBLISHABLE_KEY) {
            console.error(
                "REGISTER ERROR: SUPABASE_PUBLISHABLE_KEY missing"
            );
            return res.status(500).json({
                success: false,
                error:
                    "SUPABASE_PUBLISHABLE_KEY غير موجود في إعدادات Vercel."
            });
        }
        if (!SUPABASE_SECRET_KEY) {
            console.error(
                "REGISTER ERROR: SUPABASE_SECRET_KEY missing"
            );
            return res.status(500).json({
                success: false,
                error:
                    "SUPABASE_SECRET_KEY غير موجود في إعدادات Vercel."
            });
        }
        // ==================================================
        // CLIENTS
        // ==================================================
        /*
         * Client خاص بالمصادقة.
         * لا نستخدم الـSecret Key هنا.
         */
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
        /*
         * Client إداري للسيرفر فقط.
         *
         * مهم:
         * لا ترسل هذا المفتاح إلى المتصفح.
         */
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
                success: false,
                error:
                    "أدخل اسم المستخدم."
            });
        }
        if (
            username.length < 2 ||
            username.length > 30
        ) {
            return res.status(400).json({
                success: false,
                error:
                    "اسم المستخدم يجب أن يكون بين حرفين و30 حرفاً."
            });
        }
        if (!email) {
            return res.status(400).json({
                success: false,
                error:
                    "أدخل البريد الإلكتروني."
            });
        }
        if (!password) {
            return res.status(400).json({
                success: false,
                error:
                    "أدخل كلمة المرور."
            });
        }
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                error:
                    "كلمة المرور يجب أن تكون 8 أحرف على الأقل."
            });
        }
        // ==================================================
        // SIGN UP
        // ==================================================
        const origin =
            req.headers.origin ||
            "";
        const redirectUrl =
            `${origin}/login.html?confirmed=true`;
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
                        username:
                            username
                    }
                }
            });
        // ==================================================
        // AUTH ERROR
        // ==================================================
        if (error) {
            console.error(
                "SUPABASE AUTH ERROR:",
                {
                    message: error.message,
                    code: error.code,
                    status: error.status,
                    name: error.name
                }
            );
            const message =
                String(
                    error.message || ""
                ).toLowerCase();
            if (
                message.includes("already registered") ||
                message.includes("already exists") ||
                message.includes("user already registered")
            ) {
                return res.status(409).json({
                    success: false,
                    error:
                        "هذا البريد الإلكتروني مسجل مسبقاً."
                });
            }
            return res.status(400).json({
                success: false,
                error:
                    error.message ||
                    "تعذر إنشاء الحساب."
            });
        }
        // ==================================================
        // USER
        // ==================================================
        const user =
            data?.user;
        if (!user?.id) {
            console.error(
                "REGISTER ERROR: Supabase returned no user"
            );
            return res.status(500).json({
                success: false,
                error:
                    "تمت محاولة إنشاء الحساب لكن لم يتم استلام بيانات المستخدم."
            });
        }
        // ==================================================
        // PROFILE
        // ==================================================
        /*
         * نحفظ فقط الأعمدة الموجودة فعلياً في جدول profiles.
         *
         * حسب جدولك:
         * id
         * username
         * email
         *
         * لا نرسل full_name أو avatar_url
         * حتى لا يحدث PGRST204 بسبب عمود غير معروف.
         */
        const profileData = {
            id:
                user.id,
            username:
                username,
            email:
                email
        };
        const {
            error: profileError
        } =
            await supabaseAdmin
                .from("profiles")
                .upsert(
                    profileData,
                    {
                        onConflict:
                            "id"
                    }
                );
        // ==================================================
        // PROFILE ERROR
        // ==================================================
        if (profileError) {
            /*
             * هذا السطر مهم جداً.
             *
             * راح يظهر لنا الخطأ الكامل في Vercel Logs.
             */
            console.error(
                "PROFILE CREATE ERROR:",
                JSON.stringify(
                    {
                        message:
                            profileError.message,
                        details:
                            profileError.details,
                        hint:
                            profileError.hint,
                        code:
                            profileError.code,
                        status:
                            profileError.status
                    },
                    null,
                    2
                )
            );
            /*
             * الحساب في Auth تم إنشاؤه.
             *
             * لذلك لا نحاول إنشاءه مرة ثانية.
             */
            return res.status(500).json({
                success: false,
                error:
                    "تم إنشاء الحساب، لكن تعذر حفظ بيانات الملف الشخصي.",
                debug:
                    process.env.NODE_ENV === "development"
                        ? profileError.message
                        : undefined
            });
        }
        // ==================================================
        // SUCCESS
        // ==================================================
        console.log(
            "REGISTER SUCCESS:",
            user.id
        );
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
        // ==================================================
        // UNEXPECTED ERROR
        // ==================================================
        console.error(
            "REGISTER API ERROR:",
            {
                message:
                    error?.message,
                stack:
                    error?.stack,
                name:
                    error?.name
            }
        );
        return res.status(500).json({
            success: false,
            error:
                "حدث خطأ غير متوقع أثناء إنشاء الحساب."
        });
    }
}
