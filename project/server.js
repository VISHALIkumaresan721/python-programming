/**
 * Virtual Server Engine
 * Simulates API endpoints, Database persistence, and AI logic
 */

class VirtualServer {
    constructor() {
        this.db = this._initializeDB();
        this.logs = [];
        this.log('Virtual Server initialized. Ready for requests.');
    }

    log(message) {
        const entry = {
            timestamp: new Date().toLocaleTimeString(),
            message: message,
            id: Math.random().toString(36).substr(2, 9)
        };
        this.logs.unshift(entry);
        if (this.logs.length > 50) this.logs.pop();

        // Dispatch event for UI listeners
        window.dispatchEvent(new CustomEvent('serverLog', { detail: entry }));
    }

    _initializeDB() {
        const defaultMenu = [
            { id: 1, name: 'Truffle Mushroom Risotto', price: 24, category: 'Veg', calories: 450, prepTime: 20, mood: ['Stressed', 'Happy'], image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?q=80&w=400' },
            { id: 2, name: 'Dragon Fire wings', price: 16, category: 'Non-Veg', calories: 600, prepTime: 15, mood: ['Energetic', 'Adventurous'], image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?q=80&w=400' },
            { id: 3, name: 'Zen Avocado Salad', price: 18, category: 'Veg', calories: 300, prepTime: 10, mood: ['Calm', 'Bored'], image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400' },
            { id: 4, name: 'Midnight Lava Cake', price: 12, category: 'Dessert', calories: 550, prepTime: 12, mood: ['Sad', 'Happy'], image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=400' },
            { id: 5, name: 'Cosmic Blue Latte', price: 8, category: 'Drinks', calories: 120, prepTime: 5, mood: ['Tired', 'Creative'], image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=400' }
        ];

        const db = JSON.parse(localStorage.getItem('restaurant_db')) || {
            users: [],
            orders: [],
            menu: defaultMenu,
            currentUser: null,
            stats: { dailyRevenue: [800, 950, 700, 1100, 1500, 1800, 1400], categories: [40, 30, 15, 15] }
        };

        if (!localStorage.getItem('restaurant_db')) {
            localStorage.setItem('restaurant_db', JSON.stringify(db));
        }
        return db;
    }

    save() {
        localStorage.setItem('restaurant_db', JSON.stringify(this.db));
    }

    // --- API ENDPOINTS ---

    async post(url, data) {
        this.log(`POST request to ${url}...`);
        await new Promise(r => setTimeout(r, 600)); // Simulate network latency

        if (url === '/api/auth/login') {
            const user = this.db.users.find(u => u.email === data.email);
            if (user) {
                this.db.currentUser = user;
                this.save();
                this.log(`User ${user.name} logged in.`);
                return { success: true, user: user };
            }
            return { success: false, message: 'Invalid credentials' };
        }

        if (url === '/api/orders/place') {
            this.log('Processing transaction...');
            const newOrder = {
                id: 'ORD' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                ...data,
                date: new Date().toISOString()
            };
            this.db.orders.push(newOrder);

            // Update user streaks
            if (this.db.currentUser) {
                const user = this.db.users.find(u => u.id === this.db.currentUser.id);
                user.streak = (user.streak || 0) + 1;
                user.lastOrder = new Date().toISOString();
                this.db.currentUser = user;
            }

            this.save();
            this.log(`Order ${newOrder.id} confirmed. Total: $${data.total.toFixed(2)}`);
            return { success: true, orderId: newOrder.id };
        }

        if (url === '/api/ai/recommend') {
            this.log(`AI Engine: Analyzing mood "${data.mood}"...`);
            const recommendations = this.db.menu.filter(item =>
                item.mood.some(m => m.toLowerCase() === data.mood.toLowerCase())
            );
            return { success: true, recommendations: recommendations.slice(0, 3) };
        }
    }

    async get(url) {
        this.log(`GET request to ${url}...`);
        await new Promise(r => setTimeout(r, 400));

        if (url === '/api/menu') return this.db.menu;
        if (url === '/api/stats') return this.db.stats;
    }
}

const server = new VirtualServer();
window.server = server;
