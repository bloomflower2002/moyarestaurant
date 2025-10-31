// admin-analytics.js
class AdminAnalytics {
    constructor(admin) {
        this.admin = admin;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Analytics
        document.getElementById('analytics-period').addEventListener('change', () => {
            this.loadAnalytics();
        });
    }

    async loadAnalytics() {
        const period = document.getElementById('analytics-period').value;
        
        try {
            const response = await this.admin.makeApiCall(`/api/admin/analytics/dashboard?period=${period}`);
            const analyticsData = response.analytics || response;
            
            const revenueByDay = this.calculateRevenueByDay();
            const topItems = this.calculateTopItems();
            const statusDistribution = this.calculateStatusDistribution();
            const customerStats = this.calculateCustomerStats();
            
            this.admin.analyticsData = {
                revenueTrend: revenueByDay,
                topItems: topItems,
                orderStatus: statusDistribution,
                customerStats: customerStats
            };
            
            this.updateAnalyticsCards();
            this.updateCharts();
            
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.admin.utils.showNotification('Error loading analytics', 'error');
        }
    }

    updateAnalyticsCards() {
        const totalRevenue = this.admin.orders.reduce((sum, order) => 
            sum + parseFloat(order.total_amount || 0), 0
        );
        
        const today = new Date().toDateString();
        const todayOrders = this.admin.orders.filter(order => 
            new Date(order.created_at).toDateString() === today
        );
        
        const uniqueCustomers = this.getUniqueCustomers();
        const averageOrderValue = this.admin.orders.length > 0 ? totalRevenue / this.admin.orders.length : 0;

        document.getElementById('total-revenue-card').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('total-orders-card').textContent = this.admin.orders.length;
        document.getElementById('today-orders-card').textContent = todayOrders.length;
        document.getElementById('unique-customers-card').textContent = uniqueCustomers;
        document.getElementById('avg-order-value-card').textContent = `$${averageOrderValue.toFixed(2)}`;
        document.getElementById('menu-items-card').textContent = this.admin.menuItems.length;
    }

    calculateRevenueByDay() {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const revenue = days.map(() => 0);
        
        this.admin.orders.forEach(order => {
            const day = new Date(order.created_at).getDay();
            const adjustedDay = day === 0 ? 6 : day - 1;
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
        
        this.admin.orders.forEach(order => {
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
        
        this.admin.orders.forEach(order => {
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

    getUniqueCustomers() {
        const customerIds = new Set();
        this.admin.orders.forEach(order => {
            if (order.user_id) {
                customerIds.add(order.user_id);
            }
        });
        return customerIds.size;
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

        // Other charts initialization...
        this.initializeOtherCharts();
    }

    initializeOtherCharts() {
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
                        '#28a745', '#ffc107', '#17a2b8', '#20c997', '#dc3545'
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
        this.revenueChart.data.labels = this.admin.analyticsData.revenueTrend?.labels || [];
        this.revenueChart.data.datasets[0].data = this.admin.analyticsData.revenueTrend?.data || [];
        this.revenueChart.update();

        // Update Items Chart
        this.itemsChart.data.labels = this.admin.analyticsData.topItems?.labels || [];
        this.itemsChart.data.datasets[0].data = this.admin.analyticsData.topItems?.data || [];
        this.itemsChart.update();

        // Update Status Chart
        this.statusChart.data.labels = this.admin.analyticsData.orderStatus?.labels || [];
        this.statusChart.data.datasets[0].data = this.admin.analyticsData.orderStatus?.data || [];
        this.statusChart.update();

        // Update Customer Chart
        if (this.admin.analyticsData.customerStats) {
            const newCustomers = this.admin.analyticsData.customerStats.totalCustomers - this.admin.analyticsData.customerStats.repeatCustomers;
            this.customerChart.data.datasets[0].data = [
                newCustomers,
                this.admin.analyticsData.customerStats.repeatCustomers
            ];
            this.customerChart.update();
        }
    }
}