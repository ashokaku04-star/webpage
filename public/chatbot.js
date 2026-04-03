import { knowledgeBase } from './knowledge_base.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject Chatbot HTML (Neural Aesthetic)
    const chatbotHTML = `
        <div id="chatbot-container">
            <div id="chat-window">
                <div class="chat-header">
                    <div>
                        <span class="status"></span>
                        <h3>ASHOKA'S AI ASSISTANT</h3>
                    </div>
                </div>
                <div class="chat-messages" id="chat-messages">
                    <div class="message bot">Hello! I'm Ashoka's AI assistant. Ask me anything about his projects, experience, or technical skills!</div>
                </div>
                <div class="typing-indicator" id="typing-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
                <div class="chat-input-area">
                    <input type="text" id="chat-input" placeholder="Type your message..." autocomplete="off">
                    <button id="chat-send"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
            <div id="chat-trigger" class="magnetic">
                <i class="fas fa-comment-alt"></i>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    const chatTrigger = document.getElementById('chat-trigger');
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');
    const typingIndicator = document.getElementById('typing-indicator');

    // 2. Event Listeners
    chatTrigger.addEventListener('click', () => {
        chatWindow.classList.toggle('active');
        if (chatWindow.classList.contains('active')) {
            chatInput.focus();
        }
    });

    chatSend.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });

    // --- Auto-Open Chatbot ---
    setTimeout(() => {
        if (!chatWindow.classList.contains('active')) {
            chatWindow.classList.add('active');
        }
    }, 3000); // Popup after 3 seconds

    async function handleSendMessage() {
        const query = chatInput.value.trim();
        if (!query) return;

        // Add user message to UI
        addMessage(query, 'user');
        chatInput.value = '';

        // Show typing indicator
        showTyping(true);

        try {
            // 1. Try Local RAG first for speed and as a safety net
            const localResponse = tryLocalSearch(query);
            if (localResponse) {
                // If we have a very strong local match, use it immediately
                setTimeout(() => {
                    showTyping(false);
                    addMessage(localResponse, 'bot');
                }, 800);
                return;
            }

            // 2. Fetch context for Groq
            const context = retrieveContext(query);

            // 3. Request from Groq (Real-time AI)
            const aiResponse = await callGroqAPI(query, context);
            showTyping(false);
            addMessage(aiResponse, 'bot');
        } catch (error) {
            console.error("Chatbot/Groq Error:", error);

            // 4. Fallback to Local Engine if API fails
            const fallbackResponse = processLocalRAG(query);
            showTyping(false);
            addMessage(fallbackResponse, 'bot');
        }
    }

    // --- High-Precision Local Search (Safety Net) ---
    // --- High-Precision Local Search (Safety Net) ---
    function tryLocalSearch(query) {
        const q = query.toLowerCase();

        // 1. Q&A Matching from Knowledge Base
        const qaMatch = knowledgeBase.qa.find(item => q.includes(item.question.toLowerCase().replace('?', '')));
        if (qaMatch) return qaMatch.answer;

        if (q === 'hi' || q === 'hello' || q === 'hey') {
            return "Hello! I'm Ashoka's neural assistant. How can I help you explore his work today?";
        }

        if (q.includes('who is') || q.includes('about ashoka') || q.includes('who are you')) {
            return knowledgeBase.personalInfo.summary;
        }

        if (q.includes('power bi') || q.includes('tableau') || q.includes('visual')) {
            return "Ashoka is highly proficient in Power BI and Tableau. He has built several interactive dashboards for E-commerce segmentation, Marketing KPIs, and Media Performance Tracking. For example, he designed a Power BI dashboard that identified high-value customer segments for an e-commerce platform.";
        }

        if (q.includes('resume') || q.includes('cv') || q.includes('download')) {
            return `You can download Ashoka's latest CV right here: <a href="./Data/ASHOKA%20K%20U.pdf" download="ASHOKA_K_U_Resume.pdf" style="color:#00D4FF; text-decoration:underline;">Download Resume</a>`;
        }
        return null;
    }

    let lastQueryType = null;

    // --- Advanced Local Search (Mini-RAG / Keyword Scoring) ---
    function tryLocalSearch(query) {
        const q = query.toLowerCase();

        // 1. Precise Q&A Matching
        const qaMatch = knowledgeBase.qa.find(item => q.includes(item.question.toLowerCase().replace('?', '')));
        if (qaMatch) return qaMatch.answer;

        // 2. Skill Recognition (Direct mention of Scikit-learn, TensorFlow, etc.)
        const foundSkills = [];
        Object.values(knowledgeBase.skills).forEach(skillList => {
            skillList.forEach(skill => {
                if (q.includes(skill.toLowerCase())) {
                    foundSkills.push(skill);
                }
            });
        });

        if (foundSkills.length > 0) {
            return `Yes, Ashoka is highly skilled in **${foundSkills.join(', ')}**. He has applied these in major projects like **${knowledgeBase.projects[0].title}** and his recent work at **Big Wings LLC**. Would you like to see a specific project where he used these?`;
        }

        // 3. Common Greetings
        if (q === 'hi' || q === 'hello' || q === 'hey') {
            return "Hello! I'm Ashoka's neural assistant. How can I help you explore his work today?";
        }

        if (q.includes('who is') || q.includes('about ashoka') || q.includes('who are you')) {
            return knowledgeBase.personalInfo.summary;
        }

        // 4. Skills Recognition (Handle typos like 'skils')
        if (q.includes('skill') || q.includes('skil') || q.includes('technolog') || q.includes('competenc')) {
            const ai = knowledgeBase.skills.AI.join(', ');
            const prog = knowledgeBase.skills.Programming.join(', ');
            const data = knowledgeBase.skills.Data.join(', ');
            return `Ashoka is an expert in **AI & Data Engineering**. \n\n**Core Skills:**\n• **AI/ML**: ${ai}\n• **Programming**: ${prog}\n• **Data Analytics**: ${data}\n\nHe is particularly strong in **RAG architectures** and **Power BI/Tableau** visualization.`;
        }

        // 5. Experience Recognition
        if (q.includes('experience') || q.includes('work') || q.includes('career') || q.includes('job')) {
            const exp = knowledgeBase.experience.map(e => `• **${e.role}** at ${e.company} (${e.period})`).join('\n');
            return `Ashoka has over 6 years of professional experience across AI, Analytics, and VFX:\n\n${exp}\n\nWould you like more details on his current role at Big Wings LLC?`;
        }

        if (q.includes('resume') || q.includes('cv') || q.includes('download')) {
            return `You can download Ashoka's latest CV right here: <a href="./Data/ASHOKA%20K%20U.pdf" download="ASHOKA_K_U_Resume.pdf" style="color:#00D4FF; text-decoration:underline;">Download Resume</a>`;
        }
        return null;
    }

    function processLocalRAG(query) {
        const q = query.toLowerCase();
        let snippets = [];

        // 1. Smart Project Match
        const bestProject = knowledgeBase.projects.reduce((best, current) => {
            let score = 0;
            if (q.includes(current.title.toLowerCase())) score += 10;
            current.tech.split(',').forEach(t => { if (q.includes(t.trim().toLowerCase())) score += 5; });
            if (current.details.toLowerCase().split(' ').some(word => q.includes(word))) score += 1;

            return (score > (best.score || 0)) ? { project: current, score } : best;
        }, { score: 0 });

        if (bestProject.score > 3) {
            const p = bestProject.project;
            let resp = `### ${p.title}\n\n${p.details}\n\n**Final Result:** ${p.result}\n\n**Tech Used:** ${p.tech}\n\n[View on GitHub](${p.github})`;
            if (p.image) resp += `\n\n![Project Image](${p.image})`;
            return resp;
        }

        // 2. Project List Overview
        if (q.includes('project') || q.includes('portfolio') || q.includes('show') || q.includes('built')) {
            knowledgeBase.projects.slice(0, 4).forEach(p => {
                snippets.push(`• **${p.title}**: ${p.result}`);
            });
            return "Ashoka has a deep portfolio of AI and Data projects. Here are some key highlights:\n\n" + snippets.join('\n\n') + "\n\nAsk me about a specific project like 'Fraud Detection' or 'CLV' for more details!";
        }

        // 3. Fallback Overview
        return "I'm specialized in Ashoka's professional background. You can ask me about his **Skills** (like Python or Power BI), his **Projects** (like Fraud Detection or RAG), or his **Experience** at Big Wings LLC. How can I assist you?";
    }

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;

        // Simple Markdown conversion for links, images, and HEADERS
        let formattedText = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="width:100%; border-radius:12px; margin-top:10px; border:1px solid rgba(255,255,255,0.1); display:block;">');
        formattedText = formattedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:#00D4FF; text-decoration:underline; font-weight:600;">$1</a>');
        formattedText = formattedText.replace(/### (.*?)(\n|$)/g, '<h4 style="color:#00D4FF; margin:0 0 10px 0;">$1</h4>');

        msgDiv.innerHTML = formattedText.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTyping(show) {
        if (show) {
            typingIndicator.classList.add('active');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            typingIndicator.classList.remove('active');
        }
    }

    // --- Retrieval Phase ---
    function retrieveContext(query) {
        const q = query.toLowerCase();
        let snippets = [];

        if (q.includes('skill') || q.includes('python') || q.includes('ml') || q.includes('ai') || q.includes('data')) {
            snippets.push(`Technical Skills: ${JSON.stringify(knowledgeBase.skills)}`);
        }
        if (q.includes('experience') || q.includes('work') || q.includes('job') || q.includes('big wings')) {
            snippets.push(`Professional Experience: ${JSON.stringify(knowledgeBase.experience)}`);
        }
        if (q.includes('project') || q.includes('clv') || q.includes('fraud') || q.includes('ecommerce')) {
            snippets.push(`Featured Projects: ${JSON.stringify(knowledgeBase.projects)}`);
        }
        if (q.includes('who') || q.includes('ashoka') || q.includes('contact')) {
            snippets.push(`Personal Information: ${JSON.stringify(knowledgeBase.personalInfo)}`);
        }

        if (snippets.length === 0) {
            snippets.push(`General Bio: ${knowledgeBase.personalInfo.about}`);
        }

        return snippets.join('\n\n');
    }

    // --- Generative Phase (Railway Backend) ---
    async function callGroqAPI(query, context) {
        // REPLACE THIS with your final Railway App URL (e.g., https://your-app-name.railway.app)
        const BACKEND_URL = "https://ashoka-ai-backend-production.up.railway.app";

        try {
            const response = await fetch(`${BACKEND_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ query, context })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.details || "API Error");
            }

            const data = await response.json();
            return data.response;

        } catch (error) {
            console.warn("Backend Error, Falling back to local RAG:", error);
            throw error; // Let handleSendMessage catch this and use fallback
        }
    }
});
