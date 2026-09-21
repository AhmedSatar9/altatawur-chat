// ==========================================
// SUPABASE CONFIG
// ==========================================

const SUPABASE_URL =
    "https://wxsricscchalzvazdbzd.supabase.co";


const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_5oPDD77Veu5OczxaZje7vg_orfNjB5t";


// ==========================================
// SUPABASE CLIENT
// ==========================================

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// ==========================================
// ELEMENTS
// ==========================================

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

function showMessage(
    text,
    type = "error"
) {

    if (!message) {
        return;
    }


    message.textContent =
        text;


    message.className =
        `message ${type}`;


    message.classList.remove(
        "hidden"
    );

}


function hideMessage() {

    if (!message) {
        return;
    }


    message.classList.add(
        "hidden"
    );

}


// ==========================================
// LOGIN TAB
// ==========================================

loginTab.addEventListener(
    "click",
    () => {

        loginTab.classList.add(
            "active"
        );

        registerTab.classList.remove(
            "active"
        );


        loginForm.classList.remove(
            "hidden"
        );

        registerForm.classList.add(
            "hidden"
        );


        hideMessage();

    }
);


// ==========================================
// REGISTER TAB
// ==========================================

registerTab.addEventListener(
    "click",
    () => {

        registerTab.classList.add(
            "active"
        );

        loginTab.classList.remove(
            "active"
        );


        registerForm.classList.remove(
            "hidden"
        );

        loginForm.classList.add(
            "hidden"
        );


        hideMessage();

    }
);


// ==========================================
// LOGIN
// ==========================================

loginForm.addEventListener(
    "submit",
    async (event) => {

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


        if (!email || !password) {

            showMessage(
                "اكتب البريد الإلكتروني وكلمة المرور.",
                "error"
            );

            return;

        }


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


            if (error) {

                throw error;

            }


            if (!data?.session) {

                throw new Error(
                    "لم يتم إنشاء جلسة تسجيل الدخول."
                );

            }


            window.location.replace(
                "/"
            );


        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );


            let text =
                "حدث خطأ أثناء تسجيل الدخول.";


            const errorMessage =
                error?.message
                    ?.toLowerCase() || "";


            if (
                errorMessage.includes(
                    "invalid login credentials"
                )
            ) {

                text =
                    "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

            }


            else if (
                errorMessage.includes(
                    "email not confirmed"
                )
            ) {

                text =
                    "يجب تأكيد البريد الإلكتروني أولاً. تحقق من بريدك.";

            }


            else if (
                error?.message
            ) {

                text =
                    error.message;

            }


            showMessage(
                text,
                "error"
            );


        } finally {

            loginButton.disabled =
                false;


            loginButton.textContent =
                "تسجيل الدخول";

        }

    }
);


// ==========================================
// REGISTER
// ==========================================

registerForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        hideMessage();


        const username =
            document
                .getElementById(
                    "registerUsername"
                )
                .value
                .trim();


        const email =
            document
                .getElementById(
                    "registerEmail"
                )
                .value
                .trim()
                .toLowerCase();


        const password =
            document
                .getElementById(
                    "registerPassword"
                )
                .value;


        const confirmPassword =
            document
                .getElementById(
                    "registerConfirmPassword"
                )
                .value;


        // ==================================
        // VALIDATION
        // ==================================

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


        if (
            password !==
            confirmPassword
        ) {

            showMessage(
                "كلمتا المرور غير متطابقتين.",
                "error"
            );

            return;

        }


        registerButton.disabled =
            true;


        registerButton.textContent =
            "جاري إنشاء الحساب...";


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


            // ==================================
            // EXISTING USER
            // ==================================

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


            // ==================================
            // SUCCESS
            // ==================================

            showMessage(
                "تم إنشاء حسابك بنجاح. تحقق من بريدك الإلكتروني ثم سجّل الدخول.",
                "success"
            );


            registerForm.reset();


            setTimeout(
                () => {

                    loginTab.click();

                },
                2500
            );


        } catch (error) {

            console.error(
                "REGISTER ERROR:",
                error
            );


            let text =
                "تعذر إنشاء الحساب.";


            const errorMessage =
                error?.message
                    ?.toLowerCase() || "";


            if (
                errorMessage.includes(
                    "user already registered"
                )
            ) {

                text =
                    "هذا البريد الإلكتروني مستخدم مسبقاً.";

            }


            else if (
                error?.message
            ) {

                text =
                    error.message;

            }


            showMessage(
                text,
                "error"
            );


        } finally {

            registerButton.disabled =
                false;


            registerButton.textContent =
                "إنشاء الحساب";

        }

    }
);


// ==========================================
// CHECK SESSION
// ==========================================

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

            window.location.replace(
                "/"
            );

        }


    } catch (error) {

        console.error(
            "CHECK SESSION ERROR:",
            error
        );

    }

}


checkSession();
