// ======================================================
// التطور چات - LOGIN / REGISTER
// ======================================================
"use strict";
// ======================================================
// SUPABASE CONFIG
// ======================================================
const SUPABASE_URL =
    "https://wxsricscchalzvazdbzd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_5oPDD77VeuO5czxaZje7vg_orfNjB5t";
// ======================================================
// START
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
    // --------------------------------------------------
    // CHECK SUPABASE
    // --------------------------------------------------
    if (!window.supabase) {
        console.error(
            "SUPABASE LIBRARY NOT LOADED"
        );
        alert(
            "تعذر تحميل نظام تسجيل الدخول. أعد تحميل الصفحة."
        );
        return;
    }
    // --------------------------------------------------
    // CREATE CLIENT
    // --------------------------------------------------
    const supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );
    console.log(
        "SUPABASE CLIENT READY"
    );
    // --------------------------------------------------
    // ELEMENTS
    // --------------------------------------------------
    const loginTab =
        document.getElementById("loginTab");
    const registerTab =
        document.getElementById("registerTab");
    const loginForm =
        document.getElementById("loginForm");
    const registerForm =
        document.getElementById("registerForm");
    const message =
        document.getElementById("message");
    const loginButton =
        document.getElementById("loginButton");
    const registerButton =
        document.getElementById("registerButton");
    // --------------------------------------------------
    // CHECK ELEMENTS
    // --------------------------------------------------
    console.log("AUTH ELEMENTS:", {
        loginTab,
        registerTab,
        loginForm,
        registerForm,
        message,
        loginButton,
        registerButton
    });
    if (
        !loginTab ||
        !registerTab ||
        !loginForm ||
        !registerForm ||
        !registerButton
    ) {
        console.error(
            "AUTH HTML ELEMENTS MISSING"
        );
        return;
    }
    // ==================================================
    // MESSAGE
    // ==================================================
    function showMessage(
        text,
        type = "error"
    ) {
        message.textContent = text;
        message.className =
            "message show " + type;
    }
    function hideMessage() {
        message.textContent = "";
        message.className =
            "message";
    }
    // ==================================================
    // SHOW LOGIN
    // ==================================================
    function showLoginForm() {
        loginTab.classList.add(
            "active"
        );
        registerTab.classList.remove(
            "active"
        );
        loginForm.classList.add(
            "active"
        );
        registerForm.classList.remove(
            "active"
        );
        hideMessage();
    }
    // ==================================================
    // SHOW REGISTER
    // ==================================================
    function showRegisterForm() {
        registerTab.classList.add(
            "active"
        );
        loginTab.classList.remove(
            "active"
        );
        registerForm.classList.add(
            "active"
        );
        loginForm.classList.remove(
            "active"
        );
        hideMessage();
    }
    // ==================================================
    // TAB EVENTS
    // ==================================================
    loginTab.addEventListener(
        "click",
        () => {
            console.log(
                "LOGIN TAB CLICKED"
            );
            showLoginForm();
        }
    );
    registerTab.addEventListener(
        "click",
        () => {
            console.log(
                "REGISTER TAB CLICKED"
            );
            showRegisterForm();
        }
    );
    // ==================================================
    // LOGIN
    // ==================================================
    loginForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();
            console.log(
                "LOGIN FORM SUBMITTED"
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
            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();
            const password =
                passwordInput.value;
            // ------------------------------------------
            // VALIDATION
            // ------------------------------------------
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
            // ------------------------------------------
            // BUTTON
            // ------------------------------------------
            loginButton.disabled =
                true;
            loginButton.textContent =
                "جاري تسجيل الدخول...";
            try {
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
                    data,
                    error
                );
                if (error) {
                    throw error;
                }
                if (!data?.session) {
                    throw new Error(
                        "لم يتم إنشاء جلسة تسجيل الدخول."
                    );
                }
                showMessage(
                    "تم تسجيل الدخول بنجاح.",
                    "success"
                );
                setTimeout(
                    () => {
                        window.location.href =
                            "/";
                    },
                    700
                );
            } catch (error) {
                console.error(
                    "LOGIN ERROR:",
                    error
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
    // ==================================================
    // REGISTER
    // ==================================================
    registerForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();
            console.log(
                "================================="
            );
            console.log(
                "REGISTER FORM SUBMITTED"
            );
            console.log(
                "================================="
            );
            hideMessage();
            const usernameInput =
                document.getElementById(
                    "registerUsername"
                );
            const emailInput =
                document.getElementById(
                    "registerEmail"
                );
            const passwordInput =
                document.getElementById(
                    "registerPassword"
                );
            const confirmPasswordInput =
                document.getElementById(
                    "registerConfirmPassword"
                );
            const username =
                usernameInput.value.trim();
            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();
            const password =
                passwordInput.value;
            const confirmPassword =
                confirmPasswordInput.value;
            console.log(
                "REGISTER DATA:",
                {
                    username,
                    email,
                    passwordLength:
                        password.length
                }
            );
            // ------------------------------------------
            // VALIDATION
            // ------------------------------------------
            if (username.length < 2) {
                showMessage(
                    "اسم المستخدم يجب أن يحتوي على حرفين على الأقل."
                );
                usernameInput.focus();
                return;
            }
            if (username.length > 30) {
                showMessage(
                    "اسم المستخدم يجب ألا يتجاوز 30 حرفاً."
                );
                usernameInput.focus();
                return;
            }
            if (!email) {
                showMessage(
                    "أدخل البريد الإلكتروني."
                );
                emailInput.focus();
                return;
            }
            if (!isValidEmail(email)) {
                showMessage(
                    "البريد الإلكتروني غير صحيح."
                );
                emailInput.focus();
                return;
            }
            if (password.length < 8) {
                showMessage(
                    "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل."
                );
                passwordInput.focus();
                return;
            }
            if (
                password !==
                confirmPassword
            ) {
                showMessage(
                    "كلمتا المرور غير متطابقتين."
                );
                confirmPasswordInput.focus();
                return;
            }
            // ------------------------------------------
            // BUTTON
            // ------------------------------------------
            registerButton.disabled =
                true;
            registerButton.textContent =
                "جاري إنشاء الحساب...";
            try {
                console.log(
                    "STARTING SUPABASE SIGNUP..."
                );
                // --------------------------------------
                // SIGN UP
                // --------------------------------------
                const {
                    data,
                    error
                } =
                    await supabaseClient.auth
                        .signUp({
                            email,
                            password,
                            options: {
                                data: {
                                    username
                                },
                                emailRedirectTo:
                                    window.location.origin +
                                    "/login.html"
                            }
                        });
                console.log(
                    "SUPABASE SIGNUP RESPONSE:",
                    data
                );
                console.log(
                    "SUPABASE SIGNUP ERROR:",
                    error
                );
                if (error) {
                    throw error;
                }
                // --------------------------------------
                // NO USER
                // --------------------------------------
                if (!data?.user) {
                    throw new Error(
                        "لم يتم إنشاء المستخدم."
                    );
                }
                // --------------------------------------
                // EMAIL CONFIRMATION
                // --------------------------------------
                if (
                    !data.session
                ) {
                    showMessage(
                        "تم إنشاء الحساب بنجاح. تحقق من بريدك الإلكتروني لتأكيد الحساب، ثم سجّل الدخول.",
                        "success"
                    );
                    registerForm.reset();
                    setTimeout(
                        () => {
                            showLoginForm();
                        },
                        3000
                    );
                    return;
                }
                // --------------------------------------
                // ACCOUNT CREATED + SESSION
                // --------------------------------------
                showMessage(
                    "تم إنشاء الحساب بنجاح. جاري تحويلك...",
                    "success"
                );
                registerForm.reset();
                setTimeout(
                    () => {
                        window.location.href =
                            "/";
                    },
                    700
                );
            } catch (error) {
                console.error(
                    "================================="
                );
                console.error(
                    "REGISTER ERROR:",
                    error
                );
                console.error(
                    "MESSAGE:",
                    error?.message
                );
                console.error(
                    "================================="
                );
                showMessage(
                    getAuthErrorMessage(
                        error
                    )
                );
            } finally {
                registerButton.disabled =
                    false;
                registerButton.textContent =
                    "إنشاء الحساب";
            }
        }
    );
    // ==================================================
    // EMAIL VALIDATION
    // ==================================================
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(email);
    }
    // ==================================================
    // AUTH ERROR TRANSLATION
    // ==================================================
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
                "user already registered"
            ) ||
            lower.includes(
                "already registered"
            )
        ) {
            return (
                "هذا البريد الإلكتروني مستخدم مسبقاً."
            );
        }
        if (
            lower.includes(
                "password"
            ) &&
            (
                lower.includes(
                    "weak"
                ) ||
                lower.includes(
                    "should be at least"
                )
            )
        ) {
            return (
                "كلمة المرور ضعيفة. استخدم 8 أحرف أو أكثر."
            );
        }
        if (
            lower.includes(
                "invalid email"
            )
        ) {
            return (
                "البريد الإلكتروني غير صحيح."
            );
        }
        if (
            lower.includes(
                "rate limit"
            ) ||
            lower.includes(
                "too many requests"
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
            "حدث خطأ غير متوقع أثناء العملية."
        );
    }
    // ==================================================
    // CHECK EXISTING SESSION
    // ==================================================
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
    // ==================================================
    // AUTH STATE
    // ==================================================
    supabaseClient.auth.onAuthStateChange(
        (
            event,
            session
        ) => {
            console.log(
                "AUTH EVENT:",
                event
            );
            /*
             * لا نعمل redirect من هنا.
             * التسجيل والدخول يتعاملان مع التحويل
             * بأنفسهما حتى ما يصير تعارض.
             */
        }
    );
    // ==================================================
    // START
    // ==================================================
    checkSession();
});
