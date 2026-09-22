const SUPABASE_URL =
    "https://YOUR_PROJECT.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "YOUR_SUPABASE_PUBLISHABLE_KEY";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

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


// ==========================================
// MESSAGE
// ==========================================

function showMessage(text, type = "error") {

    message.textContent = text;

    message.className =
        `message ${type}`;

    message.classList.remove("hidden");
}


function hideMessage() {

    message.classList.add("hidden");

}


// ==========================================
// TABS
// ==========================================

loginTab.addEventListener("click", () => {

    loginTab.classList.add("active");
    registerTab.classList.remove("active");

    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");

    hideMessage();

});


registerTab.addEventListener("click", () => {

    registerTab.classList.add("active");
    loginTab.classList.remove("active");

    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");

    hideMessage();

});


// ==========================================
// LOGIN
// ==========================================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    hideMessage();

    const email =
        document
            .getElementById("loginEmail")
            .value
            .trim()
            .toLowerCase();

    const password =
        document
            .getElementById("loginPassword")
            .value;

    loginButton.disabled = true;
    loginButton.textContent = "جاري تسجيل الدخول...";

    try {

        const {
            data,
            error
        } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw error;
        }

        if (!data.session) {

            throw new Error(
                "لم يتم إنشاء جلسة تسجيل الدخول."
            );

        }

        // نجاح حقيقي
        window.location.replace("/");

    } catch (error) {

        console.error("LOGIN ERROR:", error);

        let text =
            "حدث خطأ أثناء تسجيل الدخول.";

        if (
            error.message?.toLowerCase().includes(
                "invalid login credentials"
            )
        ) {

            text =
                "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

        } else if (
            error.message?.toLowerCase().includes(
                "email not confirmed"
            )
        ) {

            text =
                "يجب تأكيد البريد الإلكتروني أولاً. تحقق من بريدك.";

        } else if (error.message) {

            text = error.message;

        }

        showMessage(text, "error");

    } finally {

        loginButton.disabled = false;
        loginButton.textContent = "تسجيل الدخول";

    }

});


// ==========================================
// REGISTER
// ==========================================

registerForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    hideMessage();

    const username =
        document
            .getElementById("registerUsername")
            .value
            .trim();

    const email =
        document
            .getElementById("registerEmail")
            .value
            .trim()
            .toLowerCase();

    const password =
        document
            .getElementById("registerPassword")
            .value;

    const confirmPassword =
        document
            .getElementById("registerConfirmPassword")
            .value;


    // --------------------------------------
    // VALIDATION
    // --------------------------------------

    if (username.length < 2) {

        showMessage(
            "اسم المستخدم يجب أن يحتوي على حرفين على الأقل.",
            "error"
        );

        return;
    }


    if (password.length < 8) {

        showMessage(
            "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل.",
            "error"
        );

        return;
    }


    if (password !== confirmPassword) {

        showMessage(
            "كلمتا المرور غير متطابقتين.",
            "error"
        );

        return;
    }


    registerButton.disabled = true;

    registerButton.textContent =
        "جاري إنشاء الحساب...";


    try {

        const {
            data,
            error
        } = await supabaseClient.auth.signUp({

            email,

            password,

            options: {

                data: {
                    username
                },

                emailRedirectTo:
                    window.location.origin + "/login.html"

            }

        });


        if (error) {
            throw error;
        }


        // --------------------------------------
        // الحساب موجود مسبقاً
        // --------------------------------------

        if (
            data.user &&
            data.user.identities &&
            data.user.identities.length === 0
        ) {

            throw new Error(
                "هذا البريد الإلكتروني مستخدم مسبقاً."
            );

        }


        // --------------------------------------
        // EMAIL CONFIRMATION
        // --------------------------------------

        showMessage(
            "تم إنشاء حسابك بنجاح. تحقق من بريدك الإلكتروني واضغط رابط التأكيد، وبعدها سجّل الدخول.",
            "success"
        );


        registerForm.reset();


        setTimeout(() => {

            loginTab.click();

        }, 2500);


    } catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );

        let text =
            "تعذر إنشاء الحساب.";

        if (
            error.message?.toLowerCase().includes(
                "user already registered"
            )
        ) {

            text =
                "هذا البريد الإلكتروني مستخدم مسبقاً.";

        } else if (
            error.message
        ) {

            text =
                error.message;

        }

        showMessage(
            text,
            "error"
        );

    } finally {

        registerButton.disabled = false;

        registerButton.textContent =
            "إنشاء الحساب";

    }

});


// ==========================================
// CHECK EXISTING SESSION
// ==========================================

async function checkSession() {

    try {

        const {
            data
        } = await supabaseClient.auth.getSession();

        if (data.session) {

            window.location.replace("/");

        }

    } catch (error) {

        console.error(
            "SESSION ERROR:",
            error
        );

    }

}


checkSession();
