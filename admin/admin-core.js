// admin-core.js
window.admin = this;
class MoyaAdmin {
    constructor() {
        this.currentUser = null;
        this.orders = [];
        this.users = [];
        this.menuItems = [];
        this.analyticsData = {};
        this.currentUsersPage = 1;
        this.usersPageSize = 25;
        this.currentOrdersPage = 1;
        this.ordersPageSize = 20;
        
        // Initialize modules
        this.auth = new AdminAuth(this);
        this.usersModule = new AdminUsers(this);
        this.ordersModule = new AdminOrders(this);
        this.menuModule = new AdminMenu(this);
        this.analyticsModule = new AdminAnalytics(this);
        this.contentModule = new AdminContent(this);
        this.utils = new AdminUtils(this);
        this.pagination = new AdminPagination(this);
    }

    init() {
        this.auth.checkAuth();
        this.setupEventListeners();
        this.loadDashboardData();
        this.analyticsModule.initializeCharts();
        this.pagination.initializePagination();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection(item.dataset.section);
            });
        });

        // Logout
        document.getElementById('admin-logout').addEventListener('click', () => {
            this.auth.logout();
        });

        // Global modals
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });
    }

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
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'users':
                this.usersModule.loadUsers();
                break;
            case 'orders':
                this.ordersModule.loadOrders();
                break;
            case 'menu':
                this.menuModule.loadMenuItems();
                break;
            case 'analytics':
                this.analyticsModule.loadAnalytics();
                break;
            case 'content':
                this.contentModule.loadContent();
                break;
        }
    }

    async loadDashboardData() {
        try {
            const [ordersData, usersData, menuData, analyticsData] = await Promise.all([
                this.makeApiCall('/api/admin/orders'),
                this.makeApiCall('/api/admin/users'),
                this.makeApiCall('/api/admin/menu'),
                this.makeApiCall('/api/admin/analytics/dashboard')
            ]);

            this.orders = ordersData.orders || ordersData;
            this.users = usersData.users || usersData;
            this.menuItems = menuData.menu || menuData;
            this.analyticsData = analyticsData;

            this.updateDashboardStats();
            this.loadRecentActivity();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.utils.showNotification('Error loading dashboard data', 'error');
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
                        <div class="text-muted">${this.utils.formatTime(order.created_at)}</div>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }

// In admin-core.js setupEventListeners() method
setupEventListeners() {
    // Navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection(item.dataset.section);
        });
    });

    // Logout
    document.getElementById('admin-logout').addEventListener('click', () => {
        this.auth.logout();
    });

    // MOBILE MENU TOGGLE - ADD THIS
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const sidebar = document.querySelector('.admin-sidebar');
            sidebar.classList.toggle('mobile-open');
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        const sidebar = document.querySelector('.admin-sidebar');
        const toggle = document.getElementById('mobile-menu-toggle');
        
        if (sidebar && sidebar.classList.contains('mobile-open') && 
            !sidebar.contains(e.target) && 
            !toggle.contains(e.target)) {
            sidebar.classList.remove('mobile-open');
        }
    });

    // Close mobile menu when clicking a menu item
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const sidebar = document.querySelector('.admin-sidebar');
            if (sidebar && sidebar.classList.contains('mobile-open')) {
                sidebar.classList.remove('mobile-open');
            }
        });
    });

    // Global modals
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Add this method to your MoyaAdmin class in admin-core.js
setupResponsiveHandling() {
    // Handle window resize
    window.addEventListener('resize', this.debounce(() => {
        this.handleResize();
    }, 250));

    // Initial check
    this.handleResize();
}

handleResize() {
    const width = window.innerWidth;
    const sidebar = document.querySelector('.admin-sidebar');
    
    // Auto-close mobile menu when resizing to desktop
    if (width >= 768 && sidebar && sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
    }
}

// Debounce helper function
debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Then call setupResponsiveHandling in your init method:
init() {
    this.auth.checkAuth();
    this.setupEventListeners();
    this.setupResponsiveHandling(); // ADD THIS LINE
    this.loadDashboardData();
    this.analyticsModule.initializeCharts();
    this.pagination.initializePagination();
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
                this.auth.logout();
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
}

