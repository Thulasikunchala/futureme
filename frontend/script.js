// --- GLOBAL STATES & CONSTANTS ---
let currentProfile = null;
let chatHistory = [];

// Compute API base URL
// If running from static file directly (file://), use absolute localhost:5000 path
// If running served by Express server, use relative path
const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:5000' : '';

/* --- SCROLL ANIMATION OBSERVER --- */
const sections = document.querySelectorAll('section');
const observerOptions = {
    root: null,
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const sectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if(entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

sections.forEach(section => {
    sectionObserver.observe(section);
});

/* --- GENERATION CONTROLLER --- */
async function generateFutureMe(event) {
    event.preventDefault();

    // DOM Elements
    const btnSubmit = document.getElementById('btnSubmit');
    const errorMsg = document.getElementById('errorMsg');
    const loadingBox = document.getElementById('loadingBox');
    const resultBox = document.getElementById('resultBox');
    const loadingText = document.getElementById('loadingText');

    // Values
    const name = document.getElementById('userName').value.trim();
    const age = document.getElementById('userAge').value.trim();
    const goal = document.getElementById('userGoal').value.trim();
    const struggle = document.getElementById('userStruggle').value.trim();
    const timeline = document.getElementById('userTimeline').value.trim();
    const tone = document.getElementById('aiTone').value;

    // Local validation
    if (!name || !age || !goal || !struggle || !timeline || !tone) {
        errorMsg.style.display = 'block';
        showToast("Please fill out all identity coordinates completely.", "⚠️");
        return;
    }
    errorMsg.style.display = 'none';
    resultBox.style.display = 'none';

    // Disable button & trigger loader
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Calibrating Coordinates...";
    loadingBox.style.display = 'block';

    // Smooth scroll to loader
    loadingBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Premium loading text sequences
    const loadingMessages = [
        "Assembling future timelines and extracting perspectives...",
        "Configuring neural tone scales...",
        "Compressing fear vectors and isolation paths...",
        "Finalizing psychological identity matrices..."
    ];
    let messageIndex = 0;
    const loadingInterval = setInterval(() => {
        if (messageIndex < loadingMessages.length - 1) {
            messageIndex++;
            loadingText.innerText = loadingMessages[messageIndex];
        }
    }, 2500);

    try {
        const response = await fetch(`${API_BASE}/api/generate-futureme`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                age,
                goal,
                struggle,
                oneYearVision: timeline,
                tone
            })
        });

        const result = await response.json();
        clearInterval(loadingInterval);

        if (!response.ok || !result.success) {
            throw new Error(result.error || "Generation endpoint failed.");
        }

        // Store profile for the chat sequence
        currentProfile = {
            name,
            age,
            goal,
            struggle,
            oneYearVision: timeline,
            tone
        };

        // Render response data
        const data = result.data;
        document.getElementById('resultToneBadge').innerText = tone;
        document.getElementById('dynamicMessage').innerText = `“${data.message}”`;
        document.getElementById('dynamicIdentity').innerText = data.futureIdentity;
        document.getElementById('dynamicHabit').innerText = data.habit;
        document.getElementById('dynamicWarning').innerText = data.warning;
        document.getElementById('dynamicMantra').innerText = `“${data.mantra}”`;

        // Render Moves
        const movesContainer = document.getElementById('dynamicMoves');
        movesContainer.innerHTML = '';
        if (Array.isArray(data.nextMoves)) {
            data.nextMoves.forEach(move => {
                const li = document.createElement('li');
                li.innerText = move;
                movesContainer.appendChild(li);
            });
        }

        // Display results block & scroll
        loadingBox.style.display = 'none';
        resultBox.style.display = 'block';
        showToast("Timeline successfully calibrated! ✨");

        setTimeout(() => {
            resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

    } catch (error) {
        clearInterval(loadingInterval);
        console.error("Timeline Generation Error:", error);
        loadingBox.style.display = 'none';
        showToast("FutureMe could not respond right now. Try again.", "❌");
        errorMsg.innerText = error.message.includes("key") 
            ? "API Key missing. Please check .env setup." 
            : "FutureMe could not respond right now. Try again.";
        errorMsg.style.display = 'block';
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Generate My FutureMe";
    }
}

/* --- TOAST INTERACTION SYSTEM --- */
function showToast(message, icon = "✨") {
    const toast = document.getElementById('shareToast');
    const toastText = document.getElementById('toastText');
    const toastIcon = toast.querySelector('.toast-icon');

    toastText.innerText = message;
    if (toastIcon) toastIcon.innerText = icon;

    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

function triggerShare() {
    if (navigator.share && currentProfile) {
        navigator.share({
            title: 'My FutureMe Timeline',
            text: `I just received a profound transmission from my future self! Tone: ${currentProfile.tone}`,
            url: window.location.href
        })
        .then(() => showToast("Shared successfully!"))
        .catch((err) => console.log(err));
    } else {
        // Fallback
        copyResult();
        showToast("Result copied to clipboard! Share it with your friends.", "🔗");
    }
}

/* --- COPY TO CLIPBOARD --- */
function copyResult() {
    if (!currentProfile) {
        showToast("Generate a profile first!", "⚠️");
        return;
    }

    const message = document.getElementById('dynamicMessage').innerText;
    const identity = document.getElementById('dynamicIdentity').innerText;
    const habit = document.getElementById('dynamicHabit').innerText;
    const warning = document.getElementById('dynamicWarning').innerText;
    const mantra = document.getElementById('dynamicMantra').innerText;
    
    const moves = Array.from(document.querySelectorAll('#dynamicMoves li'))
        .map((li, index) => `${index + 1}. ${li.innerText}`)
        .join('\n');

    const copyText = `--- FUTUREME TRANSMISSION ---
From: My Future Self (${currentProfile.tone} Mode)
To: Current Self (${currentProfile.name})

MESSAGE:
${message}

FUTURE IDENTITY:
${identity}

NEXT MOVES:
${moves}

DAILY HABIT:
${habit}

WARNING:
${warning}

DAILY MANTRA:
${mantra}

Created with Nitish's Founder Labs FutureMe.`;

    navigator.clipboard.writeText(copyText)
        .then(() => {
            showToast("Transmission copied to clipboard! ✨");
        })
        .catch(err => {
            console.error("Clipboard Error:", err);
            showToast("Failed to copy. Try manual selection.", "❌");
        });
}

/* --- REGENERATE & RESET --- */
function regenerateForm() {
    const formSection = document.getElementById('app-section');
    formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Smoothly hide result and chat sections
    setTimeout(() => {
        document.getElementById('resultBox').style.display = 'none';
        document.getElementById('chat-section').style.display = 'none';
        document.getElementById('navLinkChat').style.display = 'none';
    }, 400);
}

/* --- REVEAL CHAT PANEL --- */
function revealChatSection(event) {
    if (event) event.preventDefault();

    const chatSection = document.getElementById('chat-section');
    const navLinkChat = document.getElementById('navLinkChat');

    // Make sections visible
    chatSection.style.display = 'block';
    chatSection.classList.add('visible');
    navLinkChat.style.display = 'block';

    // Initiate conversation greeting
    initiateChat();

    // Scroll smoothly to chat
    setTimeout(() => {
        chatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

/* --- CHAT ENGINE --- */
function initiateChat() {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = '';

    let greeting = "";
    if (currentProfile.tone === "Brutally Honest") {
        greeting = `I am here, ${currentProfile.name}. No more sugarcoating, no more stalling. Ask me anything about how we achieved this timeline, or what you are currently avoiding. Let's make every second count.`;
    } else if (currentProfile.tone === "CEO Mode") {
        greeting = `Direct channel established. Current goal: ${currentProfile.goal}. Focus parameters configured. What execution roadblock or operational strategic question do you want to address first?`;
    } else if (currentProfile.tone === "Calm Mentor") {
        greeting = `I'm listening, ${currentProfile.name}. I know the path ahead feels complex, but remember we've already walked it. Ask me whatever is weighing on your heart, and let's unravel it together.`;
    } else { // Motivational
        greeting = `Let's talk, ${currentProfile.name}. The vision of ${currentProfile.oneYearVision} is already our reality. What doubts or obstacles can I help you break through today? You've got this.`;
    }

    addChatBubble('future', greeting);
    chatHistory = [{ role: 'futureme', message: greeting }];
}

function addChatBubble(role, text) {
    const messagesContainer = document.getElementById('chatMessages');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    bubble.innerText = text;
    messagesContainer.appendChild(bubble);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendChatMessage(event) {
    event.preventDefault();

    const input = document.getElementById('chatInput');
    const btnSend = document.getElementById('btnSendChat');
    const typing = document.getElementById('chatTyping');
    const question = input.value.trim();

    if (!question || !currentProfile) return;

    // Render User Message
    addChatBubble('user', question);
    input.value = '';

    // Disable Input & Trigger Loader
    input.disabled = true;
    btnSend.disabled = true;
    typing.style.display = 'flex';

    // Scroll to typing bubble
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Push to history
    chatHistory.push({ role: 'user', message: question });

    try {
        const response = await fetch(`${API_BASE}/api/chat-futureme`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userProfile: currentProfile,
                chatHistory: chatHistory,
                question: question
            })
        });

        const result = await response.json();
        typing.style.display = 'none';

        if (!response.ok || !result.success) {
            throw new Error(result.error || "Chat endpoint failed.");
        }

        const reply = result.reply;
        addChatBubble('future', reply);

        // Save reply in chat logs
        chatHistory.push({ role: 'futureme', message: reply });

    } catch (error) {
        typing.style.display = 'none';
        console.error("FutureMe Chat Error:", error);
        addChatBubble('future', "FutureMe could not respond right now. Try again.");
        showToast("Connection interrupted. Try sending again.", "❌");
    } finally {
        input.disabled = false;
        btnSend.disabled = false;
        input.focus();
    }
}
