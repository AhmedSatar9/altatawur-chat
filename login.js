// ======================================================
// التطور چات
// LOGIN / REGISTER
// ======================================================
// ======================================================
// SUPABASE CONFIG
// ======================================================
const SUPABASE_URL =
    "https://wxsricscchalzvazdbzd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_5oPDD77Veu5OczxaZje7vg_orfNjB5t";
// ======================================================
// CHECK SUPABASE LIBRARY
// ======================================================
if (
    !window.supabase ||
    typeof window.supabase.createClient !== "function"
) {
    console.error(
        "Supabase library was not loaded."
    );
    alert(
        "تعذر تحميل نظام تسجيل الدخول. أعد تحميل الصفحة."
    );
    throw new Error(
        "Supabase library unavailable."
    );
}
// ======================================================
// SUPABASE CLIENT
// ======================================================
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
const message =
    document.getElementById("message");
const loginButton =
    document.getElementById("loginButton");
const registerButton =
    document.getElementById("registerButton");
// ======================================================
// MESSAGE
// ======================================================
function showMessage(
    text,
    type = "error"
) {
    if (!message) {
        return;
    }
    message.textContent = text;
    message.className =
        "message show " + type;
}
function hideMessage() {
    if (!message) {
        return;
    }
    message.textContent = "";
    message.className =
        "message";
}
// ======================================================
// SHOW LOGIN
// ======================================================
function showLoginForm() {
    loginTab?.classList.add("active");
    registerTab?.classList.remove("active");
    loginForm?.classList.add("active");
    registerForm?.classList.remove("active");
    hideMessage();
}
// ======================================================
// SHOW REGISTER
// ======================================================
function showRegisterForm() {
    registerTab?.classList.add("active");
    loginTab?.classList.remove("active");
    registerForm?.classList.add("active");
    loginForm?.classList.remove("active");
    hideMessage();
}
// ======================================================
// TAB EVENTS
// ======================================================
loginTab?.addEventListener(
    "click",
    showLoginForm
);
registerTab?.addEventListener(
    "click",
    showRegisterForm
);
// ======================================================
// LOGIN
// ======================================================
loginForm?.addEventListener(
    "submit",
    async function (event) {
        event.preventDefault();
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
                ?.toLowerCase() || "";
        const password =
            passwordInput?.value || "";
        // ----------------------------------------------
        // VALIDATION
        // ----------------------------------------------
        if (!email) {
            showMessage(
                "أدخل البريد الإلكتروني.",
                "error"
            );
            emailInput?.focus();
            return;
        }
        if (!password) {
            showMessage(
                "أدخل كلمة المرور.",
                "error"
            );
            passwordInput?.focus();
            return;
        }
        // ----------------------------------------------
        // LOADING
        // ----------------------------------------------
        if (loginButton) {
            loginButton.disabled = true;
            loginButton.textContent =
                "جاري تسجيل الدخول...";
        }
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
            if (error) {
                throw error;
            }
            if (!data?.session) {
                throw new Error(
                    "لم يتم إنشاء جلسة تسجيل الدخول."
                );
            }
            // ------------------------------------------
            // SUCCESS
            // ------------------------------------------
            showMessage(
                "تم تسجيل الدخول بنجاح...",
                "success"
            );
            window.setTimeout(
                function () {
                    window.location.replace("/");
                },
                500
            );
        } catch (error) {
            console.error(
                "LOGIN ERROR:",
                error
            );
            const rawMessage =
                String(
                    error?.message || ""
                );
            const errorMessage =
                rawMessage.toLowerCase();
            let errorText =
                "حدث خطأ أثناء تسجيل الدخول.";
            if (
                errorMessage.includes(
                    "invalid login credentials"
                )
            ) {
                errorText =
                    "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
            }
            else if (
                errorMessage.includes(
                    "email not confirmed"
                )
            ) {
                errorText =
                    "يجب تأكيد البريد الإلكتروني أولاً. تحقق من بريدك.";
            }
            else if (
                errorMessage.includes(
                    "too many requests"
                )
            ) {
                errorText =
                    "محاولات كثيرة. حاول مرة أخرى بعد قليل.";
            }
            else if (rawMessage) {
                errorText =
                    rawMessage;
            }
            showMessage(
                errorText,
                "error"
            );
        } finally {
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent =
                    "تسجيل الدخول";
            }
        }
    }
);
// ======================================================
// REGISTER
// ======================================================
registerForm?.addEventListener(
    "submit",
    async function (event) {
        event.preventDefault();
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
            usernameInput?.value?.trim() || "";
        const email =
            emailInput?.value
                ?.trim()
                ?.toLowerCase() || "";
        const password =
            passwordInput?.value || "";
        const confirmPassword =
            confirmPasswordInput?.value || "";
        // ----------------------------------------------
        // VALIDATION
        // ----------------------------------------------
        if (username.length < 2) {
            showMessage(
                "اسم المستخدم يجب أن يحتوي على حرفين على الأقل.",
                "error"
            );
            usernameInput?.focus();
            return;
        }
        if (username.length > 30) {
            showMessage(
                "اسم المستخدم يجب ألا يتجاوز 30 حرفاً.",
                "error"
            );
            usernameInput?.focus();
            return;
        }
        if (!email) {
            showMessage(
                "أدخل البريد الإلكتروني.",
                "error"
            );
            emailInput?.focus();
            return;
        }
        if (password.length < 8) {
            showMessage(
                "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل.",
                "error"
            );
            passwordInput?.focus();
            return;
        }
        if (password !== confirmPassword) {
            showMessage(
                "كلمتا المرور غير متطابقتين.",
                "error"
            );
            confirmPasswordInput?.focus();
            return;
        }
        // ----------------------------------------------
        // LOADING
        // ----------------------------------------------
        if (registerButton) {
            registerButton.disabled = true;
            registerButton.textContent =
                "جاري إنشاء الحساب...";
        }
        try {
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
            if (error) {
                throw error;
            }
            // ------------------------------------------
            // EXISTING USER
            // ------------------------------------------
            if (
                data?.user &&
                Array.isArray(
                    data.user.identities
                ) &&
                data.user.identities.length === 0
            ) {
                throw new Error(
                    "هذا البريد الإلكتروني مستخدم مسبقاً."
                );
            }
            // ------------------------------------------
            // SESSION CREATED
            // ------------------------------------------
            if (data?.session) {
                showMessage(
                    "تم إنشاء الحساب بنجاح. سيتم تحويلك الآن...",
                    "success"
                );
                registerForm?.reset();
                window.setTimeout(
                    function () {
                        window.location.replace("/");
                    },
                    800
                );
                return;
            }
            // ------------------------------------------
            // EMAIL CONFIRMATION
            // ------------------------------------------
            showMessage(
                "تم إنشاء حسابك بنجاح. تحقق من بريدك الإلكتروني واضغط رابط التأكيد، وبعدها سجّل الدخول.",
                "success"
            );
            registerForm?.reset();
            window.setTimeout(
                function () {
                    showLoginForm();
                },
                2500
            );
        } catch (error) {
            console.error(
                "REGISTER ERROR:",
                error
            );
            const rawMessage =
                String(
                    error?.message || ""
                );
            const errorMessage =
                rawMessage.toLowerCase();
            let errorText =
                "تعذر إنشاء الحساب.";
            if (
                errorMessage.includes(
                    "user already registered"
                ) ||
                errorMessage.includes(
                    "already registered"
                )
            ) {
                errorText =
                    "هذا البريد الإلكتروني مستخدم مسبقاً.";
            }
            else if (
                errorMessage.includes(
                    "password"
                ) &&
                errorMessage.includes(
                    "weak"
                )
            ) {
                errorText =
                    "كلمة المرور ضعيفة. اختر كلمة مرور أقوى.";
            }
            else if (
                errorMessage.includes(
                    "invalid email"
                )
            ) {
                errorText =
                    "البريد الإلكتروني غير صحيح.";
            }
            else if (rawMessage) {
                errorText =
                    rawMessage;
            }
            showMessage(
                errorText,
                "error"
            );
        } finally {
            if (registerButton) {
                registerButton.disabled = false;
                registerButton.textContent =
                    "إنشاء الحساب";
            }
        }
    }
);
// ======================================================
// CHECK EXISTING SESSION
// ======================================================
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
            window.location.replace("/");
        }
    } catch (error) {
        console.error(
            "SESSION CHECK ERROR:",
            error
        );
    }
}
// ======================================================
// AUTH STATE
// ======================================================
supabaseClient.auth.onAuthStateChange(
    function (event, session) {
        console.log(
            "AUTH EVENT:",
            event
        );
        /*
         * لا نقوم بالتحويل هنا.
         *
         * التحويل يتم فقط بعد نجاح
         * تسجيل الدخول أو إنشاء الحساب.
         */
    }
);
// ======================================================
// START
// ======================================================
checkSession();
