"use strict";

console.log("====================================");
console.log("التطور چات - LOGIN.JS");
console.log("====================================");

document.addEventListener("DOMContentLoaded", () => {

    console.log("DOM READY");

    // ======================================================
    // SUPABASE
    // ======================================================

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
            SUPABASE_PUBLISHABLE_KEY,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );

    // ======================================================
    // ELEMENTS
    // ======================================================

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

    const registerUsername =
        document.getElementById("registerUsername");

    const registerEmail =
        document.getElementById("registerEmail");

    const registerPassword =
        document.getElementById("registerPassword");

    const registerConfirmPassword =
        document.getElementById(
            "registerConfirmPassword"
        );

    if (!loginForm || !loginButton) {
        console.error(
            "LOGIN FORM ELEMENTS NOT FOUND"
        );
        return;
    }

    // ======================================================
    // MESSAGE
    // ======================================================

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

    // ======================================================
    // TABS
    // ======================================================

    function showLoginForm() {

        loginTab?.classList.add("active");
        registerTab?.classList.remove("active");

        loginForm?.classList.add("active");
        registerForm?.classList.remove("active");

        hideMessage();
    }

    function showRegisterForm() {

        registerTab?.classList.add("active");
        loginTab?.classList.remove("active");

        registerForm?.classList.add("active");
        loginForm?.classList.remove("active");

        hideMessage();
    }

    loginTab?.addEventListener(
        "click",
        showLoginForm
    );

    registerTab?.addEventListener(
        "click",
        showRegisterForm
    );

    // ======================================================
    // AUTH ERROR
    // ======================================================

    function getAuthErrorMessage(error) {

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
            return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
        }

        if (
            lower.includes(
                "email not confirmed"
            )
        ) {
            return "يجب تأكيد البريد الإلكتروني أولاً. تحقق من بريدك الإلكتروني ثم حاول تسجيل الدخول.";
        }

        if (
            lower.includes(
                "user already registered"
            ) ||
            lower.includes(
                "already registered"
            )
        ) {
            return "هذا البريد الإلكتروني مسجل مسبقاً.";
        }

        if (
            lower.includes(
                "password should be at least"
            )
        ) {
            return "كلمة المرور يجب أن تكون 8 أحرف على الأقل.";
        }

        if (
            lower.includes(
                "email rate limit"
            ) ||
            lower.includes(
                "rate limit"
            ) ||
            lower.includes(
                "too many requests"
            )
        ) {
            return "تم إجراء محاولات كثيرة. حاول مرة أخرى بعد قليل.";
        }

        if (
            lower.includes(
                "failed to fetch"
            )
        ) {
            return "تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.";
        }

        if (message) {
            return message;
        }

        return "حدث خطأ أثناء العملية.";
    }

    // ======================================================
    // REGISTER
    // ======================================================

    registerForm?.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();
            event.stopPropagation();

            hideMessage();

            const username =
                registerUsername?.value
                    ?.trim() || "";

            const email =
                registerEmail?.value
                    ?.trim()
                    .toLowerCase() || "";

            const password =
                registerPassword?.value || "";

            const confirmPassword =
                registerConfirmPassword?.value || "";

            // ==================================================
            // VALIDATION
            // ==================================================

            if (!username) {

                showMessage(
                    "أدخل اسم المستخدم."
                );

                registerUsername?.focus();

                return;
            }

            if (username.length < 2) {

                showMessage(
                    "اسم المستخدم يجب أن يكون حرفين على الأقل."
                );

                registerUsername?.focus();

                return;
            }

            if (!email) {

                showMessage(
                    "أدخل البريد الإلكتروني."
                );

                registerEmail?.focus();

                return;
            }

            if (!password) {

                showMessage(
                    "أدخل كلمة المرور."
                );

                registerPassword?.focus();

                return;
            }

            if (password.length < 8) {

                showMessage(
                    "كلمة المرور يجب أن تكون 8 أحرف على الأقل."
                );

                registerPassword?.focus();

                return;
            }

            if (password !== confirmPassword) {

                showMessage(
                    "كلمتا المرور غير متطابقتين."
                );

                registerConfirmPassword?.focus();

                return;
            }

            // ==================================================
            // BUTTON
            // ==================================================

            registerButton.disabled = true;

            registerButton.textContent =
                "جاري إنشاء الحساب...";

            try {

                console.log(
                    "REGISTER REQUEST"
                );

                const response =
                    await fetch(
                        "/api/register",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    username,
                                    email,
                                    password
                                })
                        }
                    );

                let result = {};

                try {
                    result =
                        await response.json();
                } catch {
                    result = {};
                }

                if (!response.ok) {

                    throw new Error(
                        result?.error ||
                        "تعذر إنشاء الحساب."
                    );
                }

                console.log(
                    "REGISTER SUCCESS:",
                    result
                );

                // ==================================================
                // SUCCESS
                // ==================================================

                showMessage(
                    "تم إنشاء حسابك بنجاح. أرسلنا رسالة تأكيد إلى بريدك الإلكتروني. افتح الرسالة واضغط رابط التأكيد، وبعدها ارجع وسجّل الدخول.",
                    "success"
                );

                registerForm.reset();

                // ننتقل لتبويب تسجيل الدخول بعد مدة بسيطة
                setTimeout(() => {

                    showLoginForm();

                }, 3500);

            } catch (error) {

                console.error(
                    "REGISTER ERROR:",
                    error
                );

                showMessage(
                    getAuthErrorMessage(error)
                );

            } finally {

                registerButton.disabled =
                    false;

                registerButton.textContent =
                    "إنشاء الحساب";
            }

        }
    );

    // ======================================================
    // LOGIN
    // ======================================================

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();
            event.stopPropagation();

            hideMessage();

            const emailInput =
                document.getElementById(
                    "loginEmail"
                );

            const passwordInput =
                document.getElementById(
                    "loginPassword"
                );

            const email =
                emailInput?.value
                    ?.trim()
                    .toLowerCase() || "";

            const password =
                passwordInput?.value || "";

            if (!email) {

                showMessage(
                    "أدخل البريد الإلكتروني."
                );

                emailInput?.focus();

                return;
            }

            if (!password) {

                showMessage(
                    "أدخل كلمة المرور."
                );

                passwordInput?.focus();

                return;
            }

            loginButton.disabled =
                true;

            loginButton.textContent =
                "جاري تسجيل الدخول...";

            try {

                console.log(
                    "LOGIN REQUEST"
                );

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth
                        .signInWithPassword({
                            email,
                            password
                        });

                console.log(
                    "LOGIN RESULT:",
                    {
                        data,
                        error
                    }
                );

                if (error) {
                    throw error;
                }

                if (!data?.session) {

                    throw new Error(
                        "تم التحقق من الحساب لكن لم يتم إنشاء جلسة."
                    );
                }

                showMessage(
                    "تم تسجيل الدخول بنجاح.",
                    "success"
                );

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            350
                        )
                );

                window.location.replace(
                    "/"
                );

            } catch (error) {

                console.error(
                    "LOGIN ERROR:",
                    error
                );

                showMessage(
                    getAuthErrorMessage(error)
                );

            } finally {

                loginButton.disabled =
                    false;

                loginButton.textContent =
                    "تسجيل الدخول";
            }

        }
    );

    // ======================================================
    // CONFIRMATION REDIRECT
    // ======================================================

    async function handleEmailConfirmation() {

        const hash =
            window.location.hash || "";

        const search =
            window.location.search || "";

        const isConfirmation =
            hash.includes("access_token") ||
            hash.includes("type=signup") ||
            search.includes("confirmed=true");

        if (!isConfirmation) {
            return false;
        }

        console.log(
            "EMAIL CONFIRMATION FLOW"
        );

        try {

            /*
             * Supabase قد ينشئ Session بعد الضغط
             * على رابط تأكيد البريد.
             *
             * نحن نريد المستخدم يرجع لتسجيل الدخول
             * بنفسه، لذلك نسجل الخروج من Session
             * الناتجة عن التأكيد.
             */

            await supabaseClient.auth.signOut();

        } catch (error) {

            console.error(
                "CONFIRMATION SIGNOUT ERROR:",
                error
            );
        }

        try {

            window.history.replaceState(
                {},
                document.title,
                "/login.html"
            );

        } catch {
            // ignore
        }

        showLoginForm();

        showMessage(
            "تم تأكيد البريد الإلكتروني بنجاح. الآن سجّل الدخول إلى حسابك.",
            "success"
        );

        return true;
    }

    // ======================================================
    // AUTH STATE
    // ======================================================

    supabaseClient.auth.onAuthStateChange(
        (event, session) => {

            console.log(
                "AUTH EVENT:",
                event,
                session
            );

            /*
             * لا نعيد التوجيه أثناء مسار تأكيد البريد.
             */
            const hash =
                window.location.hash || "";

            if (
                event === "SIGNED_IN" &&
                !hash.includes("type=signup") &&
                !hash.includes("access_token")
            ) {

                window.location.replace(
                    "/"
                );
            }

        }
    );

    // ======================================================
    // EXISTING SESSION
    // ======================================================

    async function checkExistingSession() {

        const confirmationHandled =
            await handleEmailConfirmation();

        if (confirmationHandled) {
            return;
        }

        try {

            const {
                data,
                error
            } =
                await supabaseClient.auth
                    .getSession();

            if (error) {

                console.error(
                    "SESSION ERROR:",
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
                "SESSION CHECK ERROR:",
                error
            );
        }
    }

    checkExistingSession();

    console.log(
        "LOGIN.JS READY"
    );

});
