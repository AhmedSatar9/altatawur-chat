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

const welcomeMessage =
    document.getElementById("welcomeMessage");

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

const menuOverlay =
    document.getElementById("menuOverlay");

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

let currentConversationId =
    localStorage.getItem("altatawur_current_conversation_id") || null;


// ==========================================
// REDIRECT
// ==========================================

function redirectToLogin() {

    window.location.replace(
        "/login.html"
    );

}


// ==========================================
// INITIALIZE
// ==========================================

async function initialize() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "SESSION ERROR:",
                error
            );

            redirectToLogin();

            return;

        }


        if (!data?.session) {

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
        } =
            await supabaseClient
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
            currentUser.user_metadata?.username ||
            currentUser.email ||
            "مستخدم";


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

function addMessage(
    text,
    role
) {

    if (!messages) {
        return;
    }


    if (welcomeMessage) {

        welcomeMessage.remove();

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
// SCROLL
// ==========================================

function scrollMessagesToBottom() {

    if (!messages) {
        return;
    }


    messages.scrollTop =
        messages.scrollHeight;

}


// ==========================================
// LOADING
// ==========================================

function showLoading() {

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


    addMessage(
        text,
        "user"
    );


    conversation.push({

        role: "user",

        content: text

    });


    messageInput.value =
        "";

    messageInput.style.height =
        "auto";


    isSending = true;


    sendButton.disabled =
        true;


    const loading =
        showLoading();


    try {

        const {
            data: sessionData,
            error: sessionError
        } =
            await supabaseClient.auth.getSession();


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


        let result = {};


        try {

            result =
                await response.json();

        } catch (error) {

            console.error(
                "JSON ERROR:",
                error
            );

        }


        if (!response.ok) {

            throw new Error(
                result?.error ||
                "حدث خطأ في الخادم."
            );

        }


        loading.remove();


        const answer =
            result?.message ||
            result?.answer ||
            result?.content ||
            "لم يصل رد من المساعد.";


        addMessage(
            answer,
            "assistant"
        );


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

        isSending =
            false;


        sendButton.disabled =
            false;


        messageInput.focus();

    }

}


// ==========================================
// TEXTAREA RESIZE
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
            150
        ) + "px";

}


// ==========================================
// NEW CHAT
// ==========================================

function startNewChat() {

    if (isSending) {
        return;
    }


    conversation = [];


    if (messages) {

        messages.innerHTML = "";

    }


    if (welcomeMessage) {

        messages.appendChild(
            welcomeMessage
        );

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

    sideMenu.classList.remove(
        "hidden"
    );

    menuOverlay.classList.remove(
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

    menuOverlay.classList.add(
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
        } =
            await supabaseClient.auth.signOut();


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

sendButton.addEventListener(
    "click",
    sendMessage
);


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


messageInput.addEventListener(
    "input",
    resizeMessageInput
);


newChatButton.addEventListener(
    "click",
    startNewChat
);


newChatSide.addEventListener(
    "click",
    startNewChat
);


menuButton.addEventListener(
    "click",
    openSideMenu
);


closeMenu.addEventListener(
    "click",
    closeSideMenu
);


menuOverlay.addEventListener(
    "click",
    closeSideMenu
);


logoutButton.addEventListener(
    "click",
    logout
);


// ==========================================
// ESCAPE KEY
// ==========================================

document.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Escape") {

            closeSideMenu();

        }

    }
);


// ==========================================
// START
// ==========================================

initialize();
