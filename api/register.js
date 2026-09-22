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
// SUPABASE ADMIN
// ======================================================

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

export default async function handler(
    req,
    res
) {

    if (req.method !== "POST") {

        return res.status(405).json({

            error:
                "Method Not Allowed"

        });
    }


    try {

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
                    "اكتب اسم المستخدم."

            });
        }


        if (!email) {

            return res.status(400).json({

                error:
                    "اكتب البريد الإلكتروني."

            });
        }


        if (!password) {

            return res.status(400).json({

                error:
                    "اكتب كلمة المرور."

            });
        }


        if (password.length < 6) {

            return res.status(400).json({

                error:
                    "كلمة المرور يجب أن تكون 6 أحرف على الأقل."

            });
        }


        // ==================================================
        // CREATE USER
        // ==================================================

        const {
            data,
            error
        } =
            await supabaseAdmin.auth.admin.createUser({

                email:
                    email,

                password:
                    password,

                email_confirm:
                    true,

                user_metadata: {

                    username:
                        username

                }

            });


        if (error) {

            console.error(
                "REGISTER ERROR:",
                error
            );


            if (
                String(
                    error.message
                )
                    .toLowerCase()
                    .includes(
                        "already"
                    )
            ) {

                return res.status(409).json({

                    error:
                        "هذا البريد الإلكتروني مستخدم مسبقاً."

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


        if (!user) {

            return res.status(500).json({

                error:
                    "تم إنشاء الحساب لكن لم يتم إرجاع بيانات المستخدم."

            });
        }


        // ==================================================
        // PROFILE
        // ==================================================

        const {
            error:
                profileError

        } =
            await supabaseAdmin
                .from("profiles")
                .upsert({

                    id:
                        user.id,

                    username:
                        username,

                    email:
                        email

                });


        if (profileError) {

            console.error(
                "PROFILE CREATE ERROR:",
                profileError
            );

            /*
             * الحساب موجود فعلياً،
             * لذلك لا نفشل التسجيل بالكامل.
             */
        }


        // ==================================================
        // SUCCESS
        // ==================================================

        return res.status(201).json({

            success:
                true,

            message:
                "تم إنشاء الحساب بنجاح.",

            user: {

                id:
                    user.id,

                email:
                    user.email

            }

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
