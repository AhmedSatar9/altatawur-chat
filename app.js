// ==========================================
// SUPABASE CONFIG
// ==========================================

const SUPABASE_URL =
    "https://wxsricscchalzvazdbzd.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_5oPDD77Veu5OczxaZje7vg_orfNjB5t";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// ==========================================
// DOM ELEMENTS
// ==========================================

const messages =
    document.getElementById("messages");

const messageInput =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const newChatButton =
    document.getElementById("newChatButton");

const newChatSide =
    document.getElementById("newChatSide");

const menuButton =
    document.getElementById("menuButton");

const closeMenu =
    document.getElementById("closeMenu");

const sideMenu =
    document.getElementById("sideMenu");

const logoutButton =
    document.getElementById("logoutButton");

const usernameDisplay =
    document.getElementById("usernameDisplay");


// ==========================================
// GLOBAL STATE
// ==========================================

let currentUser = null;

let conversation = [];


// ==========================================
// INITIALIZE
// ==========================================

async function initialize() {

    try {

        const {
            data,
            error
        } = await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "SESSION ERROR:",
                error
            );

            redirectToLogin();

            return;
        }


        if (!data.session) {

            redirectToLogin();

            return;
        }


        currentUser =
            data.session.user;


        await loadUserProfile();


        supabaseClient.auth.onAuthStateChange(
            (event, session) => {

                if (
                    event === "SIGNED_OUT" ||
                    !session
                ) {

                    redirectToLogin();

                }

            }
        );

    } catch (error) {

        console.error(
            "INITIALIZE ERROR:",
            error
        );

        redirectToLogin();

    }

}


// ==========================================
// REDIRECT TO LOGIN
// ==========================================

function redirectToLogin() {

    window.location.replace(
        "/login.html"
    );

}


// ==========================================
// LOAD USER PROFILE
// ==========================================

async function loadUserProfile() {

    if (!currentUser) {
        return;
    }


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("profiles")
            .select("username,email")
            .eq("id", currentUser.id)
            .single();


        if (error) {

            console.error(
                "PROFILE ERROR:",
                error
            );


            usernameDisplay.textContent =
                currentUser.user_metadata?.username ||
                currentUser.email ||
                "مستخدم";


            return;
        }


        usernameDisplay.textContent =
            data?.username ||
            data?.email ||
            currentUser.email ||
            "مستخدم";


    } catch (error) {

        console.error(
            "PROFILE LOAD ERROR:",
            error
        );


        usernameDisplay.textContent =
            currentUser.email ||
            "مستخدم";

    }

}


// ==========================================
// ADD MESSAGE
// ==========================================

function addMessage(
    text,
    role
) {

    const message =
        document.createElement("div");


    message.className =
        `message-bubble ${role}`;


    const content =
        document.createElement("div");


    content.textContent =
        text;


    message.appendChild(
        content
    );


    messages.appendChild(
        message
    );


    messages.scrollTop =
        messages.scrollHeight;

}


// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage() {

    const text =
        messageInput.value.trim();


    // لا ترسل رسالة فارغة
    if (!text) {
        return;
    }


    // التأكد من تسجيل الدخول
    if (!currentUser) {

        redirectToLogin();

        return;
    }


    // إضافة رسالة المستخدم
    addMessage(
        text,
        "user"
    );


    conversation.push({
        role: "user",
        content: text
    });


    // تنظيف مربع الكتابة
    messageInput.value = "";

    messageInput.style.height =
        "auto";


    // تعطيل زر الإرسال
    sendButton.disabled =
        true;


    // رسالة التحميل
    const loading =
        document.createElement("div");


    loading.className =
        "message-bubble assistant loading";


    loading.textContent =
        "جاري التفكير...";


    messages.appendChild(
        loading
    );


    messages.scrollTop =
        messages.scrollHeight;


    try {

        // ==================================
        // GET CURRENT SESSION
        // ==================================

        const {
            data: sessionData,
            error: sessionError
        } = await supabaseClient.auth.getSession();


        if (sessionError) {

            throw new Error(
                "تعذر التحقق من جلسة تسجيل الدخول."
            );

        }


        const session =
            sessionData?.session;


        if (!session) {

            throw new Error(
                "انتهت جلسة تسجيل الدخول."
            );

        }


        // ==================================
        // SEND REQUEST TO VERCEL API
        // ==================================

        const response =
            await fetch(
                "/api/chat",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${session.access_token}`

                    },

                    body: JSON.stringify({

                        messages:
                            conversation

                    })

                }
            );


        // ==================================
        // READ RESPONSE
        // ==================================

        let result;


        try {

            result =
                await response.json();

        } catch {

            throw new Error(
                "الخادم أرسل استجابة غير صالحة."
            );

        }


        // ==================================
        // CHECK RESPONSE
        // ==================================

        if (!response.ok) {

            throw new Error(
                result?.error ||
                "حدث خطأ في الخادم."
            );

        }


        // إزالة رسالة التحميل
        loading.remove();


        // الحصول على الرد
        const answer =
            result?.message ||
            "لم يصل رد من المساعد.";


        // عرض الرد
        addMessage(
            answer,
            "assistant"
        );


        // حفظ الرد بالمحادثة
        conversation.push({

            role: "assistant",

            content: answer

        });


    } catch (error) {

        console.error(
            "CHAT ERROR:",
            error
        );


        // إزالة التحميل
        loading.remove();


        // عرض الخطأ
        addMessage(

            error?.message ||
            "حدث خطأ. حاول مرة أخرى.",

            "assistant error-message"

        );

    } finally {

        // إعادة تفعيل الزر
        sendButton.disabled =
            false;


        // إعادة التركيز
        messageInput.focus();

    }

}


// ==========================================
// NEW CHAT
// ==========================================

function startNewChat() {

    // تصفير المحادثة
    conversation = [];


    // حذف الرسائل من الشاشة
    messages.innerHTML = "";


    // تنظيف مربع الكتابة
    messageInput.value = "";


    // إعادة حجم مربع الكتابة
    messageInput.style.height =
        "auto";


    // إغلاق القائمة
    sideMenu.classList.add(
        "hidden"
    );


    // التركيز على مربع الكتابة
    messageInput.focus();

}


// ==========================================
// OPEN MENU
// ==========================================

function openMenu() {

    sideMenu.classList.remove(
        "hidden"
    );

}


// ==========================================
// CLOSE MENU
// ==========================================

function closeSideMenu() {

    sideMenu.classList.add(
        "hidden"
    );

}


// ==========================================
// LOGOUT
// ==========================================

async function logout() {

    logoutButton.disabled =
        true;


    logoutButton.textContent =
        "جاري تسجيل الخروج...";


    try {

        const {
            error
        } = await supabaseClient.auth.signOut();


        if (error) {

            throw error;

        }


        window.location.replace(
            "/login.html"
        );


    } catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );


        logoutButton.disabled =
            false;


        logoutButton.textContent =
            "تسجيل الخروج";


        alert(
            "تعذر تسجيل الخروج. حاول مرة أخرى."
        );

    }

}


// ==========================================
// SEND BUTTON EVENT
// ==========================================

sendButton.addEventListener(
    "click",
    sendMessage
);


// ==========================================
// ENTER KEY EVENT
// ==========================================

messageInput.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


// ==========================================
// TEXTAREA AUTO RESIZE
// ==========================================

messageInput.addEventListener(
    "input",
    () => {

        messageInput.style.height =
            "auto";


        messageInput.style.height =
            Math.min(
                messageInput.scrollHeight,
                160
            ) + "px";

    }
);


// ==========================================
// NEW CHAT BUTTON
// ==========================================

newChatButton.addEventListener(
    "click",
    startNewChat
);


// ==========================================
// NEW CHAT FROM SIDE MENU
// ==========================================

newChatSide.addEventListener(
    "click",
    startNewChat
);


// ==========================================
// MENU BUTTON
// ==========================================

menuButton.addEventListener(
    "click",
    openMenu
);


// ==========================================
// CLOSE MENU BUTTON
// ==========================================

closeMenu.addEventListener(
    "click",
    closeSideMenu
);


// ==========================================
// LOGOUT BUTTON
// ==========================================

logoutButton.addEventListener(
    "click",
    logout
);


// ==========================================
// START APPLICATION
// ==========================================

initialize();
