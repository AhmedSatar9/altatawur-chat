"use strict";

console.log("====================================");
console.log("التطور چات - LOGIN.JS");
console.log("====================================");


/* ======================================================
   WAIT FOR HTML
====================================================== */

document.addEventListener("DOMContentLoaded", () => {

    console.log("DOM READY");


    /* ======================================================
       SUPABASE
    ====================================================== */

    const SUPABASE_URL =
        "https://wxsricscchalzvazdbzd.supabase.co";

    const SUPABASE_PUBLISHABLE_KEY =
        "sb_publishable_5oPDD77VeuO5czxaZje7vg_orfNjB5t";


    if (!window.supabase) {

        console.error(
            "Supabase library not loaded"
        );

        alert(
            "تعذر تحميل نظام تسجيل الدخول."
        );

        return;
    }


    const supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );


    console.log(
        "SUPABASE CLIENT READY"
    );


    /* ======================================================
       ELEMENTS
    ====================================================== */

    const loginTab =
        document.getElementById("loginTab");

    const registerTab =
        document.getElementById("registerTab");

    const loginForm =
        document.getElementById("loginForm");

    const registerForm =
        document.getElementById("registerForm");

    const messageBox =
        document.getElementById("message");

    const loginButton =
        document.getElementById("loginButton");

    const registerButton =
        document.getElementById("registerButton");


    console.log(
        "LOGIN ELEMENTS:",
        {
            loginTab,
            registerTab,
            loginForm,
            registerForm,
            messageBox,
            loginButton,
            registerButton
        }
    );


    /* ======================================================
       VERIFY
    ====================================================== */

    if (!loginForm) {

        console.error(
            "loginForm NOT FOUND"
        );

        return;
    }

    if (!loginButton) {

        console.error(
            "loginButton NOT FOUND"
        );

        return;
    }


    /* ======================================================
       MESSAGE
    ====================================================== */

    function showMessage(
        text,
        type = "error"
    ) {

        if (!messageBox) {
            return;
        }

        messageBox.textContent =
            text;

        messageBox.className =
            "message show " + type;
    }


    function hideMessage() {

        if (!messageBox) {
            return;
        }

        messageBox.textContent =
            "";

        messageBox.className =
            "message";
    }


    /* ======================================================
       LOGIN / REGISTER TABS
    ====================================================== */

    function showLoginForm() {

        if (loginTab) {
            loginTab.classList.add("active");
        }

        if (registerTab) {
            registerTab.classList.remove("active");
        }

        if (loginForm) {
            loginForm.classList.add("active");
        }

        if (registerForm) {
            registerForm.classList.remove("active");
        }

        hideMessage();
    }


    function showRegisterForm() {

        if (registerTab) {
            registerTab.classList.add("active");
        }

        if (loginTab) {
            loginTab.classList.remove("active");
        }

        if (registerForm) {
            registerForm.classList.add("active");
        }

        if (loginForm) {
            loginForm.classList.remove("active");
        }

        hideMessage();
    }


    if (loginTab) {

        loginTab.addEventListener(
            "click",
            showLoginForm
        );
    }


    if (registerTab) {

        registerTab.addEventListener(
            "click",
            showRegisterForm
        );
    }


    /* ======================================================
       LOGIN
    ====================================================== */

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();
            event.stopPropagation();


            console.log(
                "===================================="
            );

            console.log(
                "LOGIN SUBMIT FIRED"
            );

            console.log(
                "===================================="
            );


            hideMessage();


            const emailInput =
                document.getElementById(
                    "loginEmail"
                );

            const passwordInput =
                document.getElementById(
                    "loginPassword"
                );


            if (!emailInput) {

                console.error(
                    "loginEmail NOT FOUND"
                );

                showMessage(
                    "حقل البريد الإلكتروني غير موجود."
                );

                return;
            }


            if (!passwordInput) {

                console.error(
                    "loginPassword NOT FOUND"
                );

                showMessage(
                    "حقل كلمة المرور غير موجود."
                );

                return;
            }


            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();

            const password =
                passwordInput.value;


            console.log(
                "LOGIN EMAIL:",
                email
            );

            console.log(
                "PASSWORD LENGTH:",
                password.length
            );


            /* ==================================================
               VALIDATION
            ================================================== */

            if (!email) {

                showMessage(
                    "أدخل البريد الإلكتروني."
                );

                emailInput.focus();

                return;
            }


            if (!password) {

                showMessage(
                    "أدخل كلمة المرور."
                );

                passwordInput.focus();

                return;
            }


            /* ==================================================
               BUTTON
            ================================================== */

            loginButton.disabled =
                true;

            loginButton.textContent =
                "جاري تسجيل الدخول...";


            try {

                console.log(
                    "CALLING SUPABASE SIGN IN..."
                );


                /* ==================================================
                   SIGN IN
                ================================================== */

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth
                        .signInWithPassword({

                            email:
                                email,

                            password:
                                password

                        });


                console.log(
                    "SUPABASE LOGIN RESULT:",
                    {
                        data,
                        error
                    }
                );


                /* ==================================================
                   ERROR
                ================================================== */

                if (error) {

                    console.error(
                        "SUPABASE LOGIN ERROR:",
                        error
                    );

                    throw error;
                }


                /* ==================================================
                   SESSION CHECK
                ================================================== */

                if (!data?.session) {

                    console.error(
                        "NO SESSION CREATED"
                    );

                    throw new Error(
                        "تم التحقق من الحساب لكن لم يتم إنشاء جلسة تسجيل الدخول."
                    );
                }


                console.log(
                    "LOGIN SUCCESS"
                );

                console.log(
                    "USER:",
                    data.user
                );

                console.log(
                    "SESSION:",
                    data.session
                );


                /* ==================================================
                   SUCCESS
                ================================================== */

                showMessage(
                    "تم تسجيل الدخول بنجاح.",
                    "success"
                );


                /*
                 * نعطي Supabase لحظة لحفظ الجلسة
                 */

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            500
                        )
                );


                console.log(
                    "REDIRECTING TO CHAT..."
                );


                window.location.replace(
                    "/"
                );

            } catch (error) {

                console.error(
                    "===================================="
                );

                console.error(
                    "LOGIN FAILED"
                );

                console.error(
                    error
                );

                console.error(
                    "MESSAGE:",
                    error?.message
                );

                console.error(
                    "===================================="
                );


                showMessage(
                    getAuthErrorMessage(
                        error
                    )
                );

            } finally {

                loginButton.disabled =
                    false;

                loginButton.textContent =
                    "تسجيل الدخول";
            }

        }
    );


    /* ======================================================
       REGISTER
       نخلي كود التسجيل الموجود عندك يشتغل
       بدون تغيير إذا كان مربوط بملف آخر.
    ====================================================== */


    /* ======================================================
       AUTH ERROR
    ====================================================== */

    function getAuthErrorMessage(
        error
    ) {

        const message =
            String(
                error?.message || ""
            );


        const lower =
            message.toLowerCase();


        if (
            lower.includes(
                "invalid login credentials"
            )
        ) {

            return (
                "البريد الإلكتروني أو كلمة المرور غير صحيحة."
            );
        }


        if (
            lower.includes(
                "email not confirmed"
            )
        ) {

            return (
                "يجب تأكيد البريد الإلكتروني أولاً. تحقق من بريدك."
            );
        }


        if (
            lower.includes(
                "user not found"
            )
        ) {

            return (
                "لا يوجد حساب بهذا البريد الإلكتروني."
            );
        }


        if (
            lower.includes(
                "too many requests"
            ) ||
            lower.includes(
                "rate limit"
            )
        ) {

            return (
                "تم إجراء محاولات كثيرة. حاول مرة أخرى بعد قليل."
            );
        }


        if (
            lower.includes(
                "failed to fetch"
            )
        ) {

            return (
                "تعذر الاتصال بخادم تسجيل الدخول. تحقق من الإنترنت."
            );
        }


        if (message) {

            return message;
        }


        return (
            "حدث خطأ أثناء تسجيل الدخول."
        );
    }


    /* ======================================================
       AUTH STATE
    ====================================================== */

    supabaseClient.auth.onAuthStateChange(
        (
            event,
            session
        ) => {

            console.log(
                "AUTH EVENT:",
                event,
                session
            );

        }
    );


    /* ======================================================
       CHECK EXISTING SESSION
    ====================================================== */

    async function checkSession() {

        try {

            const {
                data,
                error
            } =
                await supabaseClient.auth
                    .getSession();


            if (error) {

                console.error(
                    "SESSION CHECK ERROR:",
                    error
                );

                return;
            }


            if (data?.session) {

                console.log(
                    "EXISTING SESSION FOUND"
                );

                window.location.replace(
                    "/"
                );
            }

        } catch (error) {

            console.error(
                "SESSION CHECK FAILED:",
                error
            );
        }
    }


    checkSession();


    console.log(
        "LOGIN.JS READY"
    );

});
