/**
 * Application Controller
 * Handles UI events, routing, and connects to the Virtual Server
 */

document.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();

    // UI Elements
    const menuContainer = document.getElementById('menu-container');
    const logContainer = document.getElementById('log-container');
    const streakDisplay = document.getElementById('user-streak');
    const moodBtns = document.querySelectorAll('.mood-btn');

    // Listen for Server Logs
    window.addEventListener('serverLog', (e) => {
        const log = e.detail;
        const div = document.createElement('div');
        div.className = 'log-entry animate-fade';
        div.innerHTML = `<span class="log-time">[${log.timestamp}]</span> ${log.message}`;
        logContainer.prepend(div);
    });

    // Load Menu
    async function loadMenu(filterMood = null) {
        menuContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-dim);">Analyzing your preference...</p>';

        let items;
        if (filterMood) {
            const res = await window.server.post('/api/ai/recommend', { mood: filterMood });
            items = res.recommendations;
        } else {
            items = await window.server.get('/api/menu');
        }

        menuContainer.innerHTML = '';
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'glass-card menu-card animate-fade';
            card.innerHTML = `
                <div class="tag">${item.category}</div>
                <img src="${item.image}" alt="${item.name}">
                <h3 style="margin-bottom: 0.5rem;">${item.name}</h3>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <span style="font-weight: 900; color: var(--primary); font-size: 1.2rem;">$${item.price}</span>
                    <span style="font-size: 0.8rem; color: var(--text-dim);">${item.calories} kcal • ${item.prepTime}m</span>
                </div>
                <button onclick="orderItem('${item.name}', ${item.price})" class="glow-btn" style="width: 100%;">Add to Cart</button>
            `;
            menuContainer.appendChild(card);
        });
    }

    // Handlers
    window.orderItem = async (name, price) => {
        const gst = price * 0.18;
        const total = price + gst;

        const res = await window.server.post('/api/orders/place', {
            item: name,
            total,
            gst,
            paymentMethod: 'Credit Card'
        });

        if (res.success) {
            alert(`Order Placed Successfully!\nInvoice: ${res.orderId}\nTotal: $${total.toFixed(2)}`);
            updateStreak();
        }
    };

    function updateStreak() {
        const user = window.server.db.currentUser || { streak: 0 };
        streakDisplay.innerText = `🔥 ${user.streak || 0} Day Streak`;
    }

    moodBtns.forEach(btn => {
        btn.onclick = () => {
            moodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadMenu(btn.dataset.mood);
        };
    });

    // Chatbot logic
    const chatContainer = document.getElementById('chatbot-container');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatToggle = document.getElementById('chatbot-toggle');

    window.toggleChat = () => {
        const isVisible = chatContainer.style.display === 'flex';
        chatContainer.style.display = isVisible ? 'none' : 'flex';
        chatToggle.innerText = isVisible ? '🤖' : '✖';
        if (!isVisible) {
            addChatMessage('Chef AI', 'Hello! How can I assist you today?');
        }
    };

    function addChatMessage(sender, text) {
        const div = document.createElement('div');
        div.style.padding = '0.5rem 0.8rem';
        div.style.borderRadius = '0.5rem';
        div.style.maxWidth = '80%';
        div.style.fontSize = '0.85rem';

        if (sender === 'Chef AI') {
            div.style.background = 'rgba(245, 158, 11, 0.1)';
            div.style.border = '1px solid var(--primary)';
            div.style.alignSelf = 'flex-start';
        } else {
            div.style.background = 'rgba(255, 255, 255, 0.1)';
            div.style.alignSelf = 'flex-end';
        }

        div.innerHTML = `<strong>${sender}:</strong> ${text}`;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    window.sendChatMessage = async () => {
        const text = chatInput.value.trim();
        if (!text) return;

        addChatMessage('You', text);
        chatInput.value = '';

        const res = await window.server.post('/api/ai/chat', { message: text });
        if (res.success) {
            addChatMessage('Chef AI', res.reply);
        }
    };

    chatInput.onkeypress = (e) => { if (e.key === 'Enter') sendChatMessage(); };

    // Initialize
    loadMenu();
    updateStreak();
    initCharts();
});

function initCharts() {
    const revCtx = document.getElementById('revenueChart').getContext('2d');
    const catCtx = document.getElementById('categoryChart').getContext('2d');

    new Chart(revCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Revenue Simulation ($)',
                data: [800, 950, 700, 1100, 1500, 1800, 1400],
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    new Chart(catCtx, {
        type: 'doughnut',
        data: {
            labels: ['Veg', 'Non-Veg', 'Desserts', 'Drinks'],
            datasets: [{
                data: [40, 30, 15, 15],
                backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'],
                hoverOffset: 4
            }]
        }
    });
}
