// admin-notifications.js
class AdminNotifications {
    constructor(admin) {
        this.admin = admin;
        this.notifications = [];
        this.unreadCount = 0;
        this.isPolling = false;
        this.pollingInterval = null;
        
        this.setupNotificationUI();
    }

    setupNotificationUI() {
        // Create notification bell if it doesn't exist
        if (!document.getElementById('notification-bell')) {
            this.createNotificationBell();
        }
        
        // Create notification dropdown if it doesn't exist
        if (!document.getElementById('notification-dropdown')) {
            this.createNotificationDropdown();
        }
    }

   createNotificationBell() {
    const adminUser = document.querySelector('.admin-user');
    if (!adminUser) return;

    const notificationBell = document.createElement('div');
    notificationBell.id = 'notification-bell';
    notificationBell.className = 'notification-bell';
    notificationBell.innerHTML = `
        <div class="bell-icon">🔔</div>
        <span class="notification-count" style="display: none;">0</span>
    `;

    // Insert before logout button
    const logoutBtn = document.getElementById('admin-logout');
    if (logoutBtn) {
        adminUser.insertBefore(notificationBell, logoutBtn);
    } else {
        adminUser.appendChild(notificationBell);
    }

    // Add click event with proper event handling
    notificationBell.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        this.toggleNotifications();
    });
}

createNotificationDropdown() {
    const notificationBell = document.getElementById('notification-bell');
    if (!notificationBell) return;

    const dropdown = document.createElement('div');
    dropdown.id = 'notification-dropdown';
    dropdown.className = 'notification-dropdown';
    dropdown.style.display = 'none';
    dropdown.innerHTML = `
        <div class="notification-header">
            <h4>Notifications</h4>
            <button id="clear-notifications" type="button">Clear All</button>
        </div>
        <div class="notification-list" id="notification-list">
            <div class="notification-empty">
                No new notifications
            </div>
        </div>
    `;

    document.body.appendChild(dropdown);

    // Clear notifications button
    document.getElementById('clear-notifications').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.clearNotifications();
    });

    // Close dropdown when clicking outside - with better event handling
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.notification-bell') && !e.target.closest('.notification-dropdown')) {
            this.hideNotifications();
        }
    });

    // Also close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            this.hideNotifications();
        }
    });
}

    startOrderPolling() {
        if (this.isPolling) return;
        
        this.isPolling = true;
        console.log('🔔 Starting order polling...');
        
        // Poll every 30 seconds for new orders
        this.pollingInterval = setInterval(() => {
            this.checkForNewOrders();
        }, 30000);
        
        // Initial check
        this.checkForNewOrders();
    }

    stopOrderPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.isPolling = false;
        console.log('🔔 Order polling stopped');
    }

    async checkForNewOrders() {
        try {
            // Get latest orders from the admin's data
            const currentOrderIds = new Set(this.admin.orders.map(order => order.id));
            
            // In a real app, you would fetch from API:
            // const newOrders = await this.admin.makeApiCall('/api/admin/orders/recent');
            
            // For demo, we'll simulate new orders occasionally
            if (Math.random() > 0.7) { // 30% chance to simulate new order
                this.simulateNewOrder();
            }
            
        } catch (error) {
            console.error('Error checking for new orders:', error);
        }
    }

    simulateNewOrder() {
        const newOrderId = Date.now();
        const customers = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'];
        const customer = customers[Math.floor(Math.random() * customers.length)];
        
        const newOrder = {
            id: newOrderId,
            order_number: `ORD-${newOrderId.toString().slice(-4)}`,
            customer_name: customer,
            total_amount: (Math.random() * 50 + 10).toFixed(2),
            status: 'pending',
            created_at: new Date().toISOString(),
            items: [
                { name: 'Coffee', quantity: 1, price: 4.50 },
                { name: 'Sandwich', quantity: 1, price: 8.99 }
            ]
        };

        this.addNotification({
            type: 'new_order',
            order: newOrder,
            message: `New order #${newOrder.order_number} from ${newOrder.customer_name}`,
            timestamp: new Date()
        });

        // Play notification sound
        this.playNotificationSound();
    }

    addNotification(notification) {
        const notificationObj = {
            id: Date.now(),
            ...notification,
            read: false
        };

        this.notifications.unshift(notificationObj);
        this.unreadCount++;
        
        this.updateNotificationUI();
        this.showDesktopNotification(notificationObj);
    }

    updateNotificationUI() {
        // Update badge count
        const badge = document.querySelector('.notification-count');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'block' : 'none';
            
            // Add animation for new notifications
            if (this.unreadCount > 0) {
                badge.classList.add('pulse');
                setTimeout(() => badge.classList.remove('pulse'), 1000);
            }
        }

        // Update notification list
        this.updateNotificationList();
    }

    updateNotificationList() {
        const notificationList = document.getElementById('notification-list');
        if (!notificationList) return;

        if (this.notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="notification-empty">
                    No new notifications
                </div>
            `;
            return;
        }

        notificationList.innerHTML = this.notifications.map(notification => `
            <div class="notification-item ${notification.read ? '' : 'new'}" 
                 data-id="${notification.id}"
                 onclick="admin.notifications.viewNotification(${notification.id})">
                <div class="notification-icon">
                    ${this.getNotificationIcon(notification.type)}
                </div>
                <div class="notification-content">
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
                </div>
                ${!notification.read ? '<div class="notification-dot"></div>' : ''}
            </div>
        `).join('');
    }

    getNotificationIcon(type) {
        const icons = {
            'new_order': '📦',
            'order_update': '🔄',
            'system': '⚙️',
            'alert': '⚠️'
        };
        return icons[type] || '🔔';
    }

   toggleNotifications() {
    const dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) return;

    // Use getComputedStyle for reliable visibility check
    const isVisible = window.getComputedStyle(dropdown).display === 'block';
    
    if (isVisible) {
        this.hideNotifications();
    } else {
        this.showNotifications();
    }
}

   showNotifications() {
    const dropdown = document.getElementById('notification-dropdown');
    const bell = document.getElementById('notification-bell');
    
    if (!dropdown || !bell) return;

    // Hide any other open dropdowns first
    this.hideNotifications();

    // Position dropdown below bell
    const bellRect = bell.getBoundingClientRect();
    dropdown.style.top = (bellRect.bottom + window.scrollY) + 'px';
    dropdown.style.right = (window.innerWidth - bellRect.right) + 'px';
    dropdown.style.display = 'block';
    dropdown.style.opacity = '1';
    dropdown.style.visibility = 'visible';

    // Mark all as read when dropdown is opened
    this.markAllAsRead();
}

hideNotifications() {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
        dropdown.style.opacity = '0';
        dropdown.style.visibility = 'hidden';
    }
}

    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        this.unreadCount = 0;
        this.updateNotificationUI();
    }

    clearNotifications() {
        this.notifications = [];
        this.unreadCount = 0;
        this.updateNotificationUI();
        this.hideNotifications();
    }

    viewNotification(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (!notification) return;

        // Mark as read
        notification.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.updateNotificationUI();

        // Handle different notification types
        if (notification.type === 'new_order' && notification.order) {
            this.admin.showSection('orders');
            
            // Highlight the order in the orders table
            setTimeout(() => {
                if (this.admin.ordersModule && this.admin.ordersModule.highlightOrder) {
                    this.admin.ordersModule.highlightOrder(notification.order.id);
                }
            }, 500);
        }

        this.hideNotifications();
    }

    playNotificationSound() {
        // Create audio element for notification sound
        const audio = new Audio();
        
        // You can use a simple beep sound or add a notification.mp3 file
        // For now, we'll use a simple beep using the Web Audio API
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
            
            oscillator.start(context.currentTime);
            oscillator.stop(context.currentTime + 0.5);
        } catch (error) {
            console.log('Audio context not supported');
        }
    }

    showDesktopNotification(notification) {
        // Check if browser supports notifications
        if (!("Notification" in window)) {
            return;
        }

        // Check if permission is granted
        if (Notification.permission === "granted") {
            this.createDesktopNotification(notification);
        } else if (Notification.permission !== "denied") {
            // Request permission
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    this.createDesktopNotification(notification);
                }
            });
        }
    }

    createDesktopNotification(notification) {
        const options = {
            body: notification.message,
            icon: '/favicon.ico', // Your app icon
            badge: '/favicon.ico',
            tag: 'moya-cafe-notification'
        };

        const desktopNotification = new Notification('Moya Cafe', options);

        desktopNotification.onclick = () => {
            window.focus();
            this.viewNotification(notification.id);
            desktopNotification.close();
        };

        // Auto close after 5 seconds
        setTimeout(() => {
            desktopNotification.close();
        }, 5000);
    }

    formatTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        
        return time.toLocaleDateString();
    }
}