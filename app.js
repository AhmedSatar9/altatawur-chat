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
// STATE
// ==========================================

let currentUser = null;

let conversation = [];

let isSending = false;


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


        if (!data || !data.session) {

            redirectToLogin();

            return;
        }


        currentUser =
            data.session.user;


        await loadUserProfile();


        // مراقبة حالة تسجيل الدخول

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
// USER PROFILE
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


            if (usernameDisplay) {

                usernameDisplay.textContent =
                    currentUser.user_metadata?.username ||
                    currentUser.email ||
                    "مستخدم";

            }

            return;
        }


        if (usernameDisplay) {

            usernameDisplay.textContent =
                data?.username ||
                currentUser.user_metadata?.username ||
                currentUser.email ||
                "مستخدم";

        }

    } catch (error) {

        console.error(
            "PROFILE LOAD ERROR:",
            error
        );

    }

}


// ==========================================
// ADD MESSAGE
// ==========================================

function addMessage(text, role) {

    if (!messages) {
        return;
    }


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


    scrollMessagesToBottom();

}


// ==========================================
// SCROLL TO BOTTOM
// ==========================================

function scrollMessagesToBottom() {

    if (!messages) {
        return;
    }


    messages.scrollTop =
        messages.scrollHeight;

}


// ==========================================
// SHOW LOADING
// ==========================================

function showLoading() {

    if (!messages) {
        return null;
    }


    const loading =
        document.createElement("div");


    loading.className =
        "message-bubble assistant loading";


    loading.textContent =
        "جاري التفكير...";


    messages.appendChild(
        loading
    );


    scrollMessagesToBottom();


    return loading;

}


// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage() {

    if (isSending) {
        return;
    }


    if (!messageInput) {
        return;
    }


    const text =
        messageInput.value.trim();


    if (!text) {
        return;
    }


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


    // تنظيف حقل الكتابة

    messageInput.value = "";

    messageInput.style.height =
        "auto";


    isSending = true;


    if (sendButton) {

        sendButton.disabled =
            true;

    }


    const loading =
        showLoading();


    try {

        // الحصول على جلسة المستخدم

        const {
            data: sessionData,
            error: sessionError
        } = await supabaseClient.auth.getSession();


        if (sessionError) {

            throw new Error(
                "تعذر التحقق من تسجيل الدخول."
            );

        }


        const session =
            sessionData?.session;


        if (!session) {

            throw new Error(
                "انتهت جلسة تسجيل الدخول."
            );

        }


        // إرسال المحادثة إلى API

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


        // محاولة قراءة الرد

        let result = {};

        try {

            result =
                await response.json();

        } catch (jsonError) {

            console.error(
                "JSON ERROR:",
                jsonError
            );

        }


        if (!response.ok) {

            throw new Error(
                result?.error ||
                "حدث خطأ في الخادم."
            );

        }


        // إزالة جاري التفكير

        if (loading) {

            loading.remove();

        }


        // استخراج الرد

        const answer =
            result?.message ||
            result?.answer ||
            result?.content ||
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


        if (loading) {

            loading.remove();

        }


        addMessage(
            error?.message ||
            "حدث خطأ. حاول مرة أخرى.",
            "assistant error-message"
        );

    } finally {

        isSending = false;


        if (sendButton) {

            sendButton.disabled =
                false;

        }


        if (messageInput) {

            messageInput.focus();

        }

    }

}


// ==========================================
// AUTO RESIZE TEXTAREA
// ==========================================

function resizeMessageInput() {

    if (!messageInput) {
        return;
    }


    messageInput.style.height =
        "auto";


    messageInput.style.height =
        Math.min(
            messageInput.scrollHeight,
            160
        ) + "px";

}


// ==========================================
// NEW CHAT
// ==========================================

function startNewChat() {

    conversation = [];


    if (messages) {

        messages.innerHTML =
            "";

    }


    if (messageInput) {

        messageInput.value =
            "";

        messageInput.style.height =
            "auto";

        messageInput.focus();

    }


    closeSideMenu();

}


// ==========================================
// OPEN MENU
// ==========================================

function openSideMenu() {

    if (!sideMenu) {
        return;
    }


    sideMenu.classList.remove(
        "hidden"
    );

}


// ==========================================
// CLOSE MENU
// ==========================================

function closeSideMenu() {

    if (!sideMenu) {
        return;
    }


    sideMenu.classList.add(
        "hidden"
    );

}


// ==========================================
// LOGOUT
// ==========================================

async function logout() {

    if (!logoutButton) {
        return;
    }


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

    }

}


// ==========================================
// EVENTS
// ==========================================


// إرسال الرسالة

if (sendButton) {

    sendButton.addEventListener(
        "click",
        sendMessage
    );

}


// زر Enter

if (messageInput) {

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


    // تكبير مربع الكتابة

    messageInput.addEventListener(
        "input",
        resizeMessageInput
    );

}


// محادثة جديدة - الهيدر

if (newChatButton) {

    newChatButton.addEventListener(
        "click",
        startNewChat
    );

}


// محادثة جديدة - القائمة

if (newChatSide) {

    newChatSide.addEventListener(
        "click",
        startNewChat
    );

}


// فتح القائمة

if (menuButton) {

    menuButton.addEventListener(
        "click",
        openSideMenu
    );

}


// إغلاق القائمة

if (closeMenu) {

    closeMenu.addEventListener(
        "click",
        closeSideMenu
    );

}


// تسجيل الخروج

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logout
    );

}


// ==========================================
// START APP
// ==========================================

initialize();
