const API_BASE_URL = window.location.origin + '/api';

function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

if (!getToken()) {
    window.location.href = '/pages/login.html';
}

document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/pages/login.html';
});

document.getElementById('chatbotForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const input = document.getElementById('chatbotInput');
    const message = input.value.trim();
    const language = document.getElementById('chatbotLanguage').value;

    if (!message) return;

    const messagesContainer = document.getElementById('chatbotMessages');

    const userMessage = document.createElement('div');
    userMessage.className = 'message sent';
    userMessage.innerHTML = `<p>${message}</p>`;
    messagesContainer.appendChild(userMessage);

    input.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        const response = await fetch(`${API_BASE_URL}/chat/chatbot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message, language })
        });

        const data = await response.json();

        const botMessage = document.createElement('div');
        botMessage.className = 'message received';
        botMessage.innerHTML = `<p>${data.response}</p>`;
        messagesContainer.appendChild(botMessage);

        messagesContainer.scrollTop = messagesContainer.scrollHeight;

    } catch (error) {
        console.error('Erro no chatbot:', error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'message received';
        errorMessage.innerHTML = `<p>Desculpe, ocorreu um erro. Tente novamente.</p>`;
        messagesContainer.appendChild(errorMessage);
    }
});

document.getElementById('chatbotLanguage').addEventListener('change', (e) => {
    const language = e.target.value;
    const messagesContainer = document.getElementById('chatbotMessages');

    const greetings = {
        pt: 'Olá! Como posso ajudá-lo hoje?',
        en: 'Hello! How can I help you today?',
        sena: 'Moni! Ndingakuthandizeni lero?'
    };

    messagesContainer.innerHTML = `
        <div class="message received">
            <p>${greetings[language]}</p>
        </div>
    `;
});

async function loadConversations() {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const data = await response.json();

        const container = document.getElementById('conversationsContainer');

        if (data.conversations && data.conversations.length > 0) {
            container.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${data.conversations.map(conv => `
                        <div style="padding: 16px; background: var(--bg-light); border-radius: 8px; cursor: pointer;"
                             onclick="openConversation('${conv.id}')">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 48px; height: 48px; background: var(--primary-color); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                                    ${conv.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4>${conv.full_name}</h4>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            container.innerHTML = '<p style="text-align: center; padding: 24px; color: var(--text-light);">Nenhuma conversa ainda</p>';
        }

    } catch (error) {
        console.error('Erro ao carregar conversas:', error);
        document.getElementById('conversationsContainer').innerHTML = `
            <div class="alert alert-error">Erro ao carregar conversas</div>
        `;
    }
}

function openConversation(userId) {
    window.location.href = `/pages/conversation.html?user=${userId}`;
}

loadConversations();
