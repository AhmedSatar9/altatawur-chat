const SUPABASE_URL =
    "https://wxsricscchalzvazdbzd.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "NEXT_PUBLIC_SUPABASE_URL=https://wxsricscchalzvazdbzd.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_5oPDD77Veu5OczxaZje7vg_orfNjB5t";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


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


let currentUser = null;

let conversation = [];


// ==========================================
// INITIALIZE
// ==========================================

async function initialize() {

    const {
        data,
        error
    } = await supabaseClient.auth.getSession();


    if (error) {

        console.error(error);

        window.location.replace(
            "/login.html"
        );

        return;

    }


    if (!data.session) {

        window.location.replace(
            "/login.html"
        );

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

                window.location.replace(
                    "/login.html"
                );

            }

        }
    );

}


// ==========================================
// USER PROFILE
// ==========================================

async function loadUserProfile() {

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
            "مستخدم";

        return;

    }


    usernameDisplay.textContent =
        data.username;

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


    message.appendChild(content);

    messages.appendChild(message);


    messages.scrollTop =
        messages.scrollHeight;

}


// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage() {

    const text =
        messageInput.value.trim();


    if (!text) {
        return;
    }


    if (!currentUser) {

        window.location.replace(
            "/login.html"
        );

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


    messageInput.value = "";

    messageInput.style.height =
        "auto";


    sendButton.disabled =
        true;


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

        const {
            data: sessionData
        } = await supabaseClient.auth.getSession();


        const session =
            sessionData.session;


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


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "حدث خطأ في الخادم."
            );

        }


        loading.remove();


        const answer =
            result.message ||
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


        loading.remove();


        addMessage(
            error.message ||
            "حدث خطأ. حاول مرة أخرى.",
            "assistant error-message"
        );

    } finally {

        sendButton.disabled =
            false;

        messageInput.focus();

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
// NEW CHAT
// ==========================================

function startNewChat() {

    conversation = [];

    messages.innerHTML = "";

    messageInput.value = "";

    sideMenu.classList.add(
        "hidden"
    );

    messageInput.focus();

}


newChatButton.addEventListener(
    "click",
    startNewChat
);


newChatSide.addEventListener(
    "click",
    startNewChat
);


// ==========================================
// MENU
// ==========================================

menuButton.addEventListener(
    "click",
    () => {

        sideMenu.classList.remove(
            "hidden"
        );

    }
);


closeMenu.addEventListener(
    "click",
    () => {

        sideMenu.classList.add(
            "hidden"
        );

    }
);


// ==========================================
// LOGOUT
// ==========================================

logoutButton.addEventListener(
    "click",
    async () => {

        logoutButton.disabled =
            true;

        logoutButton.textContent =
            "جاري تسجيل الخروج...";


        const {
            error
        } = await supabaseClient.auth.signOut();


        if (error) {

            console.error(
                error
            );

            logoutButton.disabled =
                false;

            logoutButton.textContent =
                "تسجيل الخروج";

            return;

        }


        window.location.replace(
            "/login.html"
        );

    }
);


// ==========================================
// START
// ==========================================

initialize();
