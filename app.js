// ==========================================
// SUPABASE
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
    } catch (error) {
        console.error(
            "INITIALIZE ERROR:",
            error
        );
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
                currentUser.email ||
                "مستخدم";
        }
    } catch (error) {
        console.error(
            "PROFILE EXCEPTION:",
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
    if (!messageInput) {
        return;
    }
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
    if (sendButton) {
        sendButton.disabled =
            true;
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
    messages.scrollTop =
        messages.scrollHeight;
    try {
        const {
            data: sessionData,
            error: sessionError
        } =
            await supabaseClient.auth.getSession();
        if (sessionError) {
            throw new Error(
                "تعذر الحصول على جلسة تسجيل الدخول."
            );
        }
        const session =
            sessionData?.session;
        if (!session) {
            throw new Error(
                "انتهت جلسة تسجيل الدخول. سجل الدخول مرة أخرى."
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
        } catch {
            result = {};
        }
        if (!response.ok) {
            throw new Error(
                result.error ||
                `خطأ من الخادم (${response.status})`
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
            error?.message ||
            "حدث خطأ. حاول مرة أخرى.",
            "assistant error-message"
        );
    } finally {
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
// NEW CHAT
// ==========================================
function startNewChat() {
    conversation = [];
    if (messages) {
        messages.innerHTML = "";
    }
    if (messageInput) {
        messageInput.value = "";
        messageInput.style.height =
            "auto";
        messageInput.focus();
    }
    if (sideMenu) {
        sideMenu.classList.add(
            "hidden"
        );
    }
}
// ==========================================
// OPEN MENU
// ==========================================
function openMenu() {
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
if (sendButton) {
    sendButton.addEventListener(
        "click",
        sendMessage
    );
}
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
    messageInput.addEventListener(
        "input",
        () => {
            messageInput.style.height =
                "auto";
            messageInput.style.height =
                Math.min(
                    messageInput.scrollHeight,
                    150
                ) + "px";
        }
    );
}
if (newChatButton) {
    newChatButton.addEventListener(
        "click",
        startNewChat
    );
}
if (newChatSide) {
    newChatSide.addEventListener(
        "click",
        startNewChat
    );
}
if (menuButton) {
    menuButton.addEventListener(
        "click",
        openMenu
    );
}
if (closeMenu) {
    closeMenu.addEventListener(
        "click",
        closeSideMenu
    );
}
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
