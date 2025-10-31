// admin.js - UPDATED WITH REAL BACKEND INTEGRATION
class MoyaAdmin {
    constructor() {
        this.currentUser = null;
        this.orders = [];
        this.users = [];
        this.menuItems = [];
        this.analyticsData = {};
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadDashboardData();
        this.initializeCharts();
    }

    // In your admin.js - Update the checkAuth method
async checkAuth() {
    const adminToken = localStorage.getItem('moya_admin_token');
    const adminUser = localStorage.getItem('moya_admin_user');
    
    if (!adminToken || !adminUser) {
        window.location.href = '/admin-login';
        return;
    }
    
    try {
        console.log('🔐 Verifying admin token...');
        
        const response = await fetch('/api/admin/verify', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Token verification failed');
        }
        
        const data = await response.json();
        
        if (data.success) {
            this.currentUser = data.admin;
            document.getElementById('admin-name').textContent = this.currentUser.name;
            console.log('✅ Admin verification successful:', this.currentUser.email);
        } else {
            throw new Error(data.message || 'Verification failed');
        }
        
    } catch (error) {
        console.error('❌ Auth error:', error);
        localStorage.removeItem('moya_admin_user');
        localStorage.removeItem('moya_admin_token');
        window.location.href = '/admin-login';
    }
}

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection(item.dataset.section);
            });
        });

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // Logout
        document.getElementById('admin-logout').addEventListener('click', () => {
            this.logout();
        });

        // Modals
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // Menu Management
        document.getElementById('add-menu-item').addEventListener('click', () => {
            this.openMenuModal();
        });

        document.getElementById('menu-item-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMenuItem();
        });

        // Order Filters
        document.getElementById('order-status-filter').addEventListener('change', () => {
            this.filterOrders();
        });

        document.getElementById('order-date-filter').addEventListener('change', () => {
            this.filterOrders();
        });

        document.getElementById('reset-filters').addEventListener('click', () => {
            this.resetFilters();
        });

        // Analytics
        document.getElementById('analytics-period').addEventListener('change', () => {
            this.loadAnalytics();
        });

        // Content Management
        document.getElementById('homepage-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveHomepageContent();
        });

        document.getElementById('promotion-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createPromotion();
        });

        // Export
        document.getElementById('export-users').addEventListener('click', () => {
            this.exportUsers();
        });

        // User Registration Form
        document.getElementById('user-registration-form').addEventListener('submit', (e) => {
            this.handleUserRegistration(e);
        });

        // Search functionality
        document.getElementById('search-users').addEventListener('input', () => {
            this.searchUsers();
        });
    }

    // API Helper Methods
    async makeApiCall(endpoint, options = {}) {
        const token = localStorage.getItem('moya_admin_token');
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const config = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(endpoint, config);
            
            if (response.status === 401) {
                this.logout();
                throw new Error('Authentication required');
            }
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    // Section Navigation
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from all menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionId).classList.add('active');
        
        // Add active class to clicked menu item
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

        // Load section-specific data
        this.loadSectionData(sectionId);
    }

    loadSectionData(sectionId) {
        switch(sectionId) {
            case 'users':
                this.loadUsers();
                break;
            case 'orders':
                this.loadOrders();
                break;
            case 'menu':
                this.loadMenuItems();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'content':
                this.loadContent();
                break;
        }
    }

    // Dashboard Functions - WITH DATABASE INTEGRATION
    async loadDashboardData() {
        try {
            // Load all necessary data in parallel
            const [ordersData, usersData, menuData, analyticsData] = await Promise.all([
                this.makeApiCall('/api/orders/all'),
                this.makeApiCall('/api/admin/users'),
                this.makeApiCall('/api/menu'),
                this.makeApiCall('/api/analytics/dashboard')
            ]);

            this.orders = ordersData.orders || ordersData;
            this.users = usersData.users || usersData;
            this.menuItems = menuData.menu || menuData;
            this.analyticsData = analyticsData;

            this.updateDashboardStats();
            this.loadRecentActivity();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Error loading dashboard data', 'error');
        }
    }

    updateDashboardStats() {
        const today = new Date().toDateString();
        const todayOrders = this.orders.filter(order => 
            new Date(order.created_at).toDateString() === today
        );
        
        const totalRevenue = this.orders.reduce((sum, order) => 
            sum + parseFloat(order.total_amount || 0), 0
        );

        const uniqueCustomers = new Set(this.orders.map(order => order.user_id)).size;

        document.getElementById('today-orders').textContent = todayOrders.length;
        document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('active-users').textContent = uniqueCustomers;
        document.getElementById('menu-items').textContent = this.menuItems.length;
    }

    async loadRecentActivity() {
        try {
            const recentOrders = this.orders
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5);

            const activityList = document.getElementById('recent-activity-list');
            activityList.innerHTML = recentOrders.map(order => `
                <div class="activity-item">
                    <div class="activity-icon">📦</div>
                    <div>
                        <strong>New order #${order.id} from ${order.user_name || 'Guest'}</strong>
                        <div class="text-muted">${this.formatTime(order.created_at)}</div>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }

    // User Management - WITH DATABASE INTEGRATION
    async loadUsers() {
        try {
            const data = await this.makeApiCall('/api/admin/users');
            this.users = data.users || data;
            this.renderUsersTable();
            
        } catch (error) {
            console.error('Error loading users:', error);
            this.showNotification('Error loading users', 'error');
        }
    }

    renderUsersTable() {
        const tbody = document.getElementById('users-tbody');
        
        if (this.users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        No users registered yet
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.phone || 'N/A'}</td>
                <td><span class="status-badge role-${user.role}">${user.role}</span></td>
                <td>${this.formatDate(user.created_at)}</td>
                <td>
                    <button class="btn-secondary" onclick="admin.viewUser(${user.id})">View</button>
                    <button class="btn-danger" onclick="admin.deleteUser(${user.id})">Delete</button>
                    ${user.role !== 'admin' ? 
                        `<button class="btn-primary" onclick="admin.promoteUser(${user.id})">Make Admin</button>` : 
                        ''
                    }
                </td>
            </tr>
        `).join('');
    }

    async viewUser(userId) {
        try {
            const userData = await this.makeApiCall(`/api/admin/users/${userId}`);
            this.showUserModal(userData);
        } catch (error) {
            console.error('Error loading user details:', error);
            this.showNotification('Error loading user details', 'error');
        }
    }

    showUserModal(user) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h3>User Details</h3>
                <div class="user-details">
                    <p><strong>Name:</strong> ${user.name}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
                    <p><strong>Role:</strong> ${user.role}</p>
                    <p><strong>Joined:</strong> ${this.formatDate(user.created_at)}</p>
                    <p><strong>Total Orders:</strong> ${user.order_count || 0}</p>
                </div>
            </div>
        `;

        modal.querySelector('.close').addEventListener('click', () => modal.remove());
        document.body.appendChild(modal);
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            await this.makeApiCall(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });
            
            this.showNotification('User deleted successfully', 'success');
            this.loadUsers(); // Reload the user list
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showNotification('Error deleting user', 'error');
        }
    }

    async promoteUser(userId) {
        if (!confirm('Are you sure you want to make this user an administrator?')) return;

        try {
            await this.makeApiCall(`/api/admin/users/${userId}/promote`, {
                method: 'PUT'
            });
            
            this.showNotification('User promoted to administrator', 'success');
            this.loadUsers(); // Reload the user list
        } catch (error) {
            console.error('Error promoting user:', error);
            this.showNotification('Error promoting user', 'error');
        }
    }

    // User Registration with Database
    async handleUserRegistration(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('reg-name').value.trim(),
            email: document.getElementById('reg-email').value.trim(),
            phone: document.getElementById('reg-phone').value.trim(),
            role: document.getElementById('reg-role').value,
            password: document.getElementById('reg-password').value
        };

        // Validation
        if (formData.password.length < 6) {
            this.showNotification('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            await this.makeApiCall('/api/admin/users', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            this.showNotification(`User ${formData.name} created successfully!`, 'success');
            this.closeUserRegistration();
            this.loadUsers(); // Reload users
        } catch (error) {
            console.error('Error creating user:', error);
            this.showNotification('Error creating user', 'error');
        }
    }

    searchUsers() {
        const query = document.getElementById('search-users').value.toLowerCase();
        const filteredUsers = this.users.filter(user => 
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.role.toLowerCase().includes(query)
        );
        this.renderFilteredUsers(filteredUsers);
    }

    renderFilteredUsers(users) {
        const tbody = document.getElementById('users-tbody');
        
        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        No users found matching your search
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.phone || 'N/A'}</td>
                <td><span class="status-badge role-${user.role}">${user.role}</span></td>
                <td>${this.formatDate(user.created_at)}</td>
                <td>
                    <button class="btn-secondary" onclick="admin.viewUser(${user.id})">View</button>
                    <button class="btn-danger" onclick="admin.deleteUser(${user.id})">Delete</button>
                    ${user.role !== 'admin' ? 
                        `<button class="btn-primary" onclick="admin.promoteUser(${user.id})">Make Admin</button>` : 
                        ''
                    }
                </td>
            </tr>
        `).join('');
    }

    // Order Management - WITH DATABASE INTEGRATION
    async loadOrders() {
        try {
            const data = await this.makeApiCall('/api/orders/all');
            this.orders = data.orders || data;
            this.renderOrdersTable();
            
        } catch (error) {
            console.error('Error loading orders:', error);
            this.showNotification('Error loading orders', 'error');
        }
    }

    async viewOrder(orderId) {
        try {
            const orderData = await this.makeApiCall(`/api/orders/details/${orderId}`);
            this.showOrderModal(orderData);
            
        } catch (error) {
            console.error('Error loading order details:', error);
            this.showNotification('Error loading order details', 'error');
        }
    }

    async updateOrderStatus(orderId, newStatus) {
        try {
            await this.makeApiCall(`/api/orders/status/${orderId}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });

            this.showNotification(`Order status updated to ${newStatus}`, 'success');
            this.loadOrders(); // Reload to reflect changes
        } catch (error) {
            console.error('Error updating order status:', error);
            this.showNotification('Error updating order status', 'error');
        }
    }

    renderOrdersTable() {
        const tbody = document.getElementById('orders-tbody');
        
        if (this.orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        No orders found
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.user_name || 'Guest'}</td>
                <td>${order.item_count || 0} items</td>
                <td>$${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                <td><span class="status-badge status-${order.status || 'pending'}">${order.status || 'pending'}</span></td>
                <td>${this.formatDate(order.created_at)}</td>
                <td>
                    <button class="btn-secondary" onclick="admin.viewOrder(${order.id})">View</button>
                    <select onchange="admin.updateOrderStatus(${order.id}, this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                        <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
            </tr>
        `).join('');
    }

    showOrderModal(orderData) {
        const modal = document.getElementById('order-detail-modal');
        const content = document.getElementById('order-detail-content');
        
        const order = orderData.order || orderData;
        const items = orderData.items || [];
        
        content.innerHTML = `
            <div class="order-detail">
                <div class="order-header">
                    <h3>Order #${order.id}</h3>
                    <span class="status-badge status-${order.status || 'pending'}">${order.status || 'pending'}</span>
                </div>
                
                <div class="order-info">
                    <div><strong>Customer:</strong> ${order.user_name || 'Guest'}</div>
                    <div><strong>Email:</strong> ${order.user_email || 'N/A'}</div>
                    <div><strong>Phone:</strong> ${order.user_phone || 'N/A'}</div>
                    <div><strong>Order Type:</strong> ${order.order_type || 'pickup'}</div>
                    <div><strong>Order Date:</strong> ${this.formatDate(order.created_at)}</div>
                    ${order.special_instructions ? `<div><strong>Special Instructions:</strong> ${order.special_instructions}</div>` : ''}
                </div>
                
                <div class="order-items">
                    <h4>Items (${items.length})</h4>
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>
                                        ${item.name} 
                                        ${item.variant ? `<br><small>(${item.variant})</small>` : ''}
                                    </td>
                                    <td>${item.quantity}</td>
                                    <td>$${parseFloat(item.price).toFixed(2)}</td>
                                    <td>$${parseFloat(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="order-total">
                    <strong>Total: $${parseFloat(order.total_amount).toFixed(2)}</strong>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    filterOrders() {
        const statusFilter = document.getElementById('order-status-filter').value;
        const dateFilter = document.getElementById('order-date-filter').value;
        
        let filteredOrders = this.orders;
        
        if (statusFilter !== 'all') {
            filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
        }
        
        if (dateFilter) {
            filteredOrders = filteredOrders.filter(order => 
                order.created_at.startsWith(dateFilter)
            );
        }
        
        this.renderFilteredOrders(filteredOrders);
    }

    renderFilteredOrders(orders) {
        const tbody = document.getElementById('orders-tbody');
        
        if (orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        No orders found matching your criteria
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.user_name || 'Guest'}</td>
                <td>${order.item_count || 0} items</td>
                <td>$${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                <td>${this.formatDate(order.created_at)}</td>
                <td>
                    <button class="btn-secondary" onclick="admin.viewOrder(${order.id})">View</button>
                </td>
            </tr>
        `).join('');
    }

    resetFilters() {
        document.getElementById('order-status-filter').value = 'all';
        document.getElementById('order-date-filter').value = '';
        this.renderOrdersTable();
    }

    // Menu Management - WITH DATABASE INTEGRATION
    async loadMenuItems() {
        try {
            const data = await this.makeApiCall('/api/menu');
            this.menuItems = data.menu || data;
            this.renderMenuItems();
            
        } catch (error) {
            console.error('Error loading menu items:', error);
            this.showNotification('Error loading menu items', 'error');
        }
    }

    renderMenuItems() {
        const grid = document.getElementById('menu-items-grid');
        
        if (this.menuItems.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>No menu items found. Add your first item!</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = this.menuItems.map(item => `
            <div class="menu-item-card">
                <img src="${this.getImageUrl(item.image_url)}" 
                     alt="${item.name}" 
                     class="menu-item-image"
                     onerror="this.src='/admin/images/placeholder.jpg'">
                <div class="menu-item-info">
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <div class="menu-item-details">
                        <strong>$${parseFloat(item.price).toFixed(2)}</strong>
                        <span class="category">${item.category_name}</span>
                        <span class="availability ${item.is_available ? 'available' : 'unavailable'}">
                            ${item.is_available ? 'Available' : 'Unavailable'}
                        </span>
                    </div>
                    <div class="menu-item-actions">
                        <button class="btn-secondary" onclick="admin.editMenuItem(${item.id})">Edit</button>
                        <button class="btn-danger" onclick="admin.deleteMenuItem(${item.id})">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // In admin.js - Update the getImageUrl method
getImageUrl(imagePath) {
    if (!imagePath) {
        return this.createDataURIPlaceholder();
    }
    
    // If it's already a data URI, return it directly
    if (imagePath.startsWith('data:')) {
        return imagePath;
    }
    
    // If it's a relative path, try to serve it
    if (imagePath.startsWith('image/')) {
        return `/${imagePath}`; // Makes it /image/ful.jpeg
    }
    
    return imagePath;
}

createDataURIPlaceholder() {
    const svg = `<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8f9fa"/>
        <rect x="10%" y="10%" width="80%" height="60%" fill="#e9ecef" rx="5"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" 
              fill="#6c757d" text-anchor="middle" dominant-baseline="middle">
            No Image
        </text>
    </svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}

    async editMenuItem(itemId) {
        try {
            const itemData = await this.makeApiCall(`/api/menu/${itemId}`);
            this.openMenuModal(itemData);
        } catch (error) {
            console.error('Error loading menu item:', error);
            this.showNotification('Error loading menu item', 'error');
        }
    }

    openMenuModal(item = null) {
        const modal = document.getElementById('menu-item-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('menu-item-form');
        
        if (item) {
            title.textContent = 'Edit Menu Item';
            this.populateMenuForm(item);
        } else {
            title.textContent = 'Add Menu Item';
            form.reset();
        }
        
        modal.style.display = 'block';
    }

    populateMenuForm(item) {
        document.getElementById('menu-item-id').value = item.id;
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-desc').value = item.description;
        document.getElementById('item-price').value = item.price;
        document.getElementById('item-category').value = item.category_name;
        document.getElementById('item-image').value = item.image_url || '';
        document.getElementById('item-available').value = item.is_available ? 'true' : 'false';
    }

    async saveMenuItem() {
        const formData = {
            id: document.getElementById('menu-item-id').value || null,
            name: document.getElementById('item-name').value,
            description: document.getElementById('item-desc').value,
            price: parseFloat(document.getElementById('item-price').value),
            category_name: document.getElementById('item-category').value,
            image_url: document.getElementById('item-image').value || null,
            is_available: document.getElementById('item-available').value === 'true'
        };

        try {
            let response;
            if (formData.id) {
                response = await this.makeApiCall(`/api/menu/${formData.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
            } else {
                response = await this.makeApiCall('/api/menu', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
            }

            this.showNotification('Menu item saved successfully', 'success');
            document.getElementById('menu-item-modal').style.display = 'none';
            this.loadMenuItems(); // Reload the menu items
        } catch (error) {
            console.error('Error saving menu item:', error);
            this.showNotification('Error saving menu item', 'error');
        }
    }

    async deleteMenuItem(itemId) {
        if (!confirm('Are you sure you want to delete this menu item?')) return;

        try {
            await this.makeApiCall(`/api/menu/${itemId}`, {
                method: 'DELETE'
            });

            this.showNotification('Menu item deleted successfully', 'success');
            this.loadMenuItems(); // Reload the menu items
        } catch (error) {
            console.error('Error deleting menu item:', error);
            this.showNotification('Error deleting menu item', 'error');
        }
    }

   // Analytics - UPDATED WITH REAL DATA AND IMPROVED DESIGN
async loadAnalytics() {
    const period = document.getElementById('analytics-period').value;
    
    try {
        // Calculate analytics from real order data
        const revenueByDay = this.calculateRevenueByDay();
        const topItems = this.calculateTopItems();
        const statusDistribution = this.calculateStatusDistribution();
        const customerStats = this.calculateCustomerStats();
        
        this.analyticsData = {
            revenueTrend: revenueByDay,
            topItems: topItems,
            orderStatus: statusDistribution,
            customerStats: customerStats
        };
        
        this.updateAnalyticsCards();
        this.updateCharts();
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        this.showNotification('Error loading analytics', 'error');
    }
}

updateAnalyticsCards() {
    // Update the analytics summary cards
    const totalRevenue = this.orders.reduce((sum, order) => 
        sum + parseFloat(order.total_amount || 0), 0
    );
    
    const today = new Date().toDateString();
    const todayOrders = this.orders.filter(order => 
        new Date(order.created_at).toDateString() === today
    );
    
    const uniqueCustomers = this.getUniqueCustomers();
    const averageOrderValue = this.orders.length > 0 ? totalRevenue / this.orders.length : 0;

    // Update cards
    document.getElementById('total-revenue-card').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('total-orders-card').textContent = this.orders.length;
    document.getElementById('today-orders-card').textContent = todayOrders.length;
    document.getElementById('unique-customers-card').textContent = uniqueCustomers;
    document.getElementById('avg-order-value-card').textContent = `$${averageOrderValue.toFixed(2)}`;
    document.getElementById('menu-items-card').textContent = this.menuItems.length;
}

calculateRevenueByDay() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const revenue = days.map(() => 0);
    
    this.orders.forEach(order => {
        const day = new Date(order.created_at).getDay();
        const adjustedDay = day === 0 ? 6 : day - 1; // Adjust for Monday start
        if (adjustedDay >= 0 && adjustedDay < 7) {
            revenue[adjustedDay] += parseFloat(order.total_amount || 0);
        }
    });
    
    return {
        labels: days,
        data: revenue
    };
}

calculateTopItems() {
    // This would need order items data - using mock for now
    // In a real app, you'd query order_items table
    const popularItems = {
        'Tibs': 45,
        'Kitfo': 38,
        'Shiro': 32,
        'Injera': 60,
        'Coffee': 42,
        'Ful': 28,
        'Chechebsa': 25,
        'Special Tea': 35
    };
    
    const sortedItems = Object.entries(popularItems)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6);
    
    return {
        labels: sortedItems.map(([name]) => name),
        data: sortedItems.map(([,count]) => count)
    };
}

calculateStatusDistribution() {
    const statusCount = {
        'completed': 0,
        'pending': 0,
        'preparing': 0,
        'ready': 0,
        'cancelled': 0
    };
    
    this.orders.forEach(order => {
        const status = order.status || 'pending';
        statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    return {
        labels: Object.keys(statusCount),
        data: Object.values(statusCount)
    };
}

calculateCustomerStats() {
    const customerOrders = {};
    
    this.orders.forEach(order => {
        if (order.user_id) {
            if (!customerOrders[order.user_id]) {
                customerOrders[order.user_id] = 0;
            }
            customerOrders[order.user_id]++;
        }
    });
    
    const orderCounts = Object.values(customerOrders);
    const repeatCustomers = orderCounts.filter(count => count > 1).length;
    
    return {
        totalCustomers: Object.keys(customerOrders).length,
        repeatCustomers: repeatCustomers,
        averageOrdersPerCustomer: orderCounts.length > 0 ? 
            (orderCounts.reduce((a, b) => a + b, 0) / orderCounts.length).toFixed(1) : 0
    };
}

initializeCharts() {
    // Revenue Trend Chart
    this.revenueChart = new Chart(document.getElementById('revenue-chart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Revenue ($)',
                data: [],
                borderColor: '#b52a2a',
                backgroundColor: 'rgba(181, 42, 42, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#b52a2a',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `$${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });

    // Top Items Chart
    this.itemsChart = new Chart(document.getElementById('items-chart'), {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Orders',
                data: [],
                backgroundColor: [
                    '#b52a2a', '#d14b4b', '#e57373', '#f8bbd0', '#f48fb1', '#ad1457'
                ],
                borderColor: [
                    '#8a1c1c', '#a83838', '#c25252', '#d81b60', '#c2185b', '#880e4f'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 10
                    }
                }
            }
        }
    });

    // Order Status Chart
    this.statusChart = new Chart(document.getElementById('status-chart'), {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#28a745', // completed
                    '#ffc107', // pending
                    '#17a2b8', // preparing
                    '#20c997', // ready
                    '#dc3545'  // cancelled
                ],
                borderColor: '#fff',
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            },
            cutout: '60%'
        }
    });

    // Customer Analytics Chart
    this.customerChart = new Chart(document.getElementById('customer-chart'), {
        type: 'doughnut',
        data: {
            labels: ['New Customers', 'Repeat Customers'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#6f42c1', '#e83e8c'],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            cutout: '60%'
        }
    });
}

updateCharts() {
    // Update Revenue Chart
    this.revenueChart.data.labels = this.analyticsData.revenueTrend?.labels || [];
    this.revenueChart.data.datasets[0].data = this.analyticsData.revenueTrend?.data || [];
    this.revenueChart.update();

    // Update Items Chart
    this.itemsChart.data.labels = this.analyticsData.topItems?.labels || [];
    this.itemsChart.data.datasets[0].data = this.analyticsData.topItems?.data || [];
    this.itemsChart.update();

    // Update Status Chart
    this.statusChart.data.labels = this.analyticsData.orderStatus?.labels || [];
    this.statusChart.data.datasets[0].data = this.analyticsData.orderStatus?.data || [];
    this.statusChart.update();

    // Update Customer Chart
    if (this.analyticsData.customerStats) {
        const newCustomers = this.analyticsData.customerStats.totalCustomers - this.analyticsData.customerStats.repeatCustomers;
        this.customerChart.data.datasets[0].data = [
            newCustomers,
            this.analyticsData.customerStats.repeatCustomers
        ];
        this.customerChart.update();
    }
}

// Add this method to handle analytics period changes
setupAnalyticsPeriodListener() {
    document.getElementById('analytics-period').addEventListener('change', (e) => {
        this.loadAnalytics();
    });
}

    // Content Management
    switchTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        document.getElementById(`${tabId}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    }

    async loadContent() {
        try {
            const contentData = await this.makeApiCall('/api/content');
            this.renderContentData(contentData);
        } catch (error) {
            console.error('Error loading content:', error);
            this.showNotification('Error loading content', 'error');
        }
    }

    renderContentData(contentData) {
        // Render homepage content, reviews, promotions from database
        // ... (implement based on your content structure)
    }

    async saveHomepageContent() {
        const formData = new FormData(document.getElementById('homepage-form'));
        
        try {
            await this.makeApiCall('/api/content/homepage', {
                method: 'POST',
                body: formData
            });

            this.showNotification('Homepage content saved successfully', 'success');
        } catch (error) {
            console.error('Error saving homepage content:', error);
            this.showNotification('Error saving homepage content', 'error');
        }
    }

    async createPromotion() {
        const formData = {
            title: document.getElementById('promotion-title').value,
            description: document.getElementById('promotion-desc').value,
            discount_percent: parseFloat(document.getElementById('promotion-discount').value),
            valid_until: document.getElementById('promotion-expiry').value
        };

        try {
            await this.makeApiCall('/api/promotions', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            this.showNotification('Promotion created successfully', 'success');
            document.getElementById('promotion-form').reset();
        } catch (error) {
            console.error('Error creating promotion:', error);
            this.showNotification('Error creating promotion', 'error');
        }
    }

    // Utility Functions
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatTime(dateString) {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showNotification(message, type = 'info') {
        // ... (keep your existing notification code)
    }

    async exportUsers() {
        try {
            const usersData = await this.makeApiCall('/api/admin/users/export');
            this.downloadCSV(usersData.csv, 'moya-users.csv');
            this.showNotification('Users exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting users:', error);
            this.showNotification('Error exporting users', 'error');
        }
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    logout() {
        localStorage.removeItem('moya_admin_token');
        localStorage.removeItem('moya_admin_user');
        window.location.href = 'admin-login.html';
    }

    // Helper methods for user registration modal
    openUserRegistration() {
        document.getElementById('user-registration-modal').style.display = 'block';
    }

    closeUserRegistration() {
        document.getElementById('user-registration-modal').style.display = 'none';
    }
}

// Initialize admin when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new MoyaAdmin();
});

// Add CSS for notifications and modals
const notificationStyles = `
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

.notification {
    position: fixed;
    top: 100px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 3000;
    display: flex;
    align-items: center;
    gap: 1rem;
    animation: slideIn 0.3s ease;
}

.notification-info { background: #17a2b8; color: white; }
.notification-success { background: #28a745; color: white; }
.notification-error { background: #dc3545; color: white; }
.notification-warning { background: #ffc107; color: black; }

.notification button {
    background: none;
    border: none;
    color: inherit;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
}

.modal {
    display: none;
    position: fixed;
    z-index: 2000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
}

.modal-content {
    background-color: white;
    margin: 5% auto;
    padding: 2rem;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
}

.close {
    float: right;
    font-size: 2rem;
    font-weight: bold;
    cursor: pointer;
    line-height: 1;
}

.close:hover {
    color: #b52a2a;
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);