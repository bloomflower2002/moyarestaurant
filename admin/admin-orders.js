// admin-orders.js
class AdminOrders {
    constructor(admin) {
        this.admin = admin;
        this.timeEstimatesKey = 'moya_order_time_estimates';
        this.expiredOrders = new Set();

        window.admin = admin;
    window.ordersModule = this;

        this.setupEventListeners();
        this.loadTimeEstimates();
        this.startTimeChecker();

        console.log('✅ AdminOrders initialized - admin object is now global');
    }

    setupEventListeners() {
        // Order Filters
        document.getElementById('order-status-filter')?.addEventListener('change', () => {
            this.filterOrders();
        });

        document.getElementById('order-date-filter')?.addEventListener('change', () => {
            this.filterOrders();
        });

        document.getElementById('reset-filters')?.addEventListener('click', () => {
            this.resetFilters();
        });
    }

    loadTimeEstimates() {
        try {
            const stored = localStorage.getItem(this.timeEstimatesKey);
            this.timeEstimates = stored ? JSON.parse(stored) : {};
            
            const expiredStored = localStorage.getItem('moya_expired_notifications');
            if (expiredStored) {
                this.expiredOrders = new Set(JSON.parse(expiredStored));
            }
        } catch (error) {
            console.error('Error loading time estimates:', error);
            this.timeEstimates = {};
            this.expiredOrders = new Set();
        }
    }

    saveTimeEstimates() {
        try {
            localStorage.setItem(this.timeEstimatesKey, JSON.stringify(this.timeEstimates));
            localStorage.setItem('moya_expired_notifications', JSON.stringify([...this.expiredOrders]));
        } catch (error) {
            console.error('Error saving time estimates:', error);
        }
    }

    startTimeChecker() {
        console.log('🕒 Starting time checker...');
        
        // Check immediately and then every 30 seconds
        this.checkExpiredTimes();
        setInterval(() => {
            this.checkExpiredTimes();
        }, 30000);
    }

    checkExpiredTimes() {
        console.log('🔍 Checking for expired orders...');
        const now = new Date();
        const expiredOrderIds = [];

        Object.keys(this.timeEstimates).forEach(orderId => {
            const estimate = this.timeEstimates[orderId];
            if (!estimate) return;
            
            try {
                const completionTime = new Date(estimate.estimated_completion_time);
                console.log(`Order ${orderId}: ${completionTime} vs now ${now}`);
                
                if (completionTime <= now && !this.expiredOrders.has(orderId)) {
                    console.log(`🛎️ Order ${orderId} is ready!`);
                    expiredOrderIds.push(orderId);
                    this.expiredOrders.add(orderId);
                }
            } catch (error) {
                console.error('Error checking time for order', orderId, error);
            }
        });

        if (expiredOrderIds.length > 0) {
            console.log(`📢 Showing notifications for orders:`, expiredOrderIds);
            this.showInteractiveNotifications(expiredOrderIds);
            this.saveTimeEstimates();
        } else {
            console.log('✅ No expired orders found');
        }
    }

    showInteractiveNotifications(orderIds) {
        orderIds.forEach(orderId => {
            // Use your existing notification system with a long duration
            this.showInteractiveToast(orderId);
        });
    }

    showInteractiveToast(orderId) {
        // Create a simple interactive notification using your existing system
        const notification = document.createElement('div');
        notification.className = 'custom-interactive-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <strong>Order #${orderId} is Ready</strong>
                    <span class="notification-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</span>
                </div>
                <div class="notification-body">
                    <p>Is this order ready to be served?</p>
                    <div class="notification-actions">
                        <button class="btn-notification-ready" onclick="admin.ordersModule.handleNotificationReady('${orderId}', this)">
                            ✅ Ready
                        </button>
                        <button class="btn-notification-add-time" onclick="admin.ordersModule.showNotificationTimeOptions('${orderId}', this)">
                            ⏰ Add Time
                        </button>
                    </div>
                    <div class="notification-time-options" style="display: none;">
                        <div class="time-options-grid">
                            <button onclick="admin.ordersModule.addNotificationTime('${orderId}', 5, this)">+5 min</button>
                            <button onclick="admin.ordersModule.addNotificationTime('${orderId}', 10, this)">+10 min</button>
                            <button onclick="admin.ordersModule.addNotificationTime('${orderId}', 15, this)">+15 min</button>
                            <button onclick="admin.ordersModule.addNotificationTime('${orderId}', 30, this)">+30 min</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add to page
        const container = document.getElementById('notification-container') || this.createNotificationContainer();
        container.appendChild(notification);

        // Auto-remove after 30 minutes
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 1800000); // 30 minutes
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }

    handleNotificationReady(orderId, button) {
        this.markAsReady(orderId);
        const notification = button.closest('.custom-interactive-notification');
        if (notification) {
            notification.remove();
        }
    }

    showNotificationTimeOptions(orderId, button) {
        const notification = button.closest('.custom-interactive-notification');
        const optionsDiv = notification.querySelector('.notification-time-options');
        if (optionsDiv) {
            optionsDiv.style.display = optionsDiv.style.display === 'none' ? 'block' : 'none';
        }
    }

    addNotificationTime(orderId, minutes, button) {
        this.setOrderTimeEstimate(orderId, minutes);
        const notification = button.closest('.custom-interactive-notification');
        if (notification) {
            notification.remove();
        }
        this.expiredOrders.delete(orderId);
        this.saveTimeEstimates();
    }

    // Test method to simulate an expired order (remove this in production)
    testExpiredOrder() {
        console.log('🧪 Testing expired order notification...');
        // Set a test order to expire now
        const testOrderId = 'test-' + Date.now();
        this.timeEstimates[testOrderId] = {
            estimated_completion_time: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
            estimated_minutes: 0,
            set_at: new Date().toISOString()
        };
        this.saveTimeEstimates();
        this.checkExpiredTimes();
    }

    async loadOrders() {
        try {
            const data = await this.admin.makeApiCall('/api/admin/orders');
            this.admin.orders = data.orders || data;
            this.renderOrdersTable();
        } catch (error) {
            console.error('Error loading orders:', error);
            this.admin.utils.showNotification('Error loading orders', 'error');
        }
    }

    async viewOrder(orderId) {
        try {
            const orderData = await this.admin.makeApiCall(`/api/admin/orders/${orderId}`);
            this.showOrderModal(orderData);
        } catch (error) {
            console.error('Error loading order details:', error);
            this.admin.utils.showNotification('Error loading order details', 'error');
        }
    }

    async updateOrderStatus(orderId, newStatus) {
        try {
            await this.admin.makeApiCall(`/api/admin/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            this.admin.utils.showNotification(`Order status updated to ${newStatus}`, 'success');
            this.loadOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
            this.admin.utils.showNotification('Error updating order status', 'error');
        }
    }

    setOrderTimeEstimate(orderId, minutes) {
        try {
            const completionTime = new Date(Date.now() + minutes * 60000);
            
            this.timeEstimates[orderId] = {
                estimated_completion_time: completionTime.toISOString(),
                estimated_minutes: minutes,
                set_at: new Date().toISOString()
            };
            
            this.saveTimeEstimates();
            this.admin.utils.showNotification(`Ready time set to ${minutes} minutes`, 'success');
            this.updateOrderTimeDisplay(orderId);
            
            const modal = document.getElementById('order-detail-modal');
            if (modal && modal.style.display === 'block') {
                this.viewOrder(orderId);
            }
        } catch (error) {
            console.error('Error setting ready time:', error);
            this.admin.utils.showNotification('Error setting ready time', 'error');
        }
    }

    updateOrderTimeDisplay(orderId) {
        const timeEstimate = this.timeEstimates[orderId];
        if (timeEstimate) {
            const timeBadge = document.querySelector(`tr[data-order-id="${orderId}"] .time-badge`);
            if (timeBadge) {
                timeBadge.textContent = this.formatTimeRemaining(timeEstimate.estimated_completion_time);
                timeBadge.className = 'time-badge';
            }
        }
    }

    formatTimeRemaining(completionTime) {
        if (!completionTime) return 'Not set';
        
        try {
            const now = new Date();
            const completion = new Date(completionTime);
            const diffMs = completion - now;
            const diffMins = Math.round(diffMs / 60000);
            
            if (diffMins <= 0) return 'Ready now';
            if (diffMins < 60) return `${diffMins} min`;
            
            const hours = Math.floor(diffMins / 60);
            const minutes = diffMins % 60;
            return `${hours}h ${minutes}m`;
        } catch (error) {
            return 'Error';
        }
    }

    getStoredTimeEstimate(order) {
        return this.timeEstimates[order.id]?.estimated_completion_time || null;
    }

    getDisplayStatus(order) {
        const timeEstimate = this.getStoredTimeEstimate(order);
        if (timeEstimate && order.status !== 'completed' && order.status !== 'cancelled') {
            return 'ready_time';
        }
        return order.status || 'pending';
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Pending',
            'ready_time': 'Ready time',
            'ready': 'Ready',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        return statusMap[status] || status;
    }

    async markAsReady(orderId) {
        try {
            await this.updateOrderStatus(orderId, 'ready');
        } catch (error) {
            console.error('Error marking order as ready:', error);
        }
    }


    showConfirmationModal(title, message, confirmCallback, confirmText = 'Confirm', cancelText = 'Cancel') {
        const modal = document.getElementById('confirmation-modal');
        const titleEl = document.getElementById('confirmation-title');
        const messageEl = document.getElementById('confirmation-message');
        const confirmBtn = document.getElementById('confirmation-confirm');
        const cancelBtn = document.getElementById('confirmation-cancel');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        confirmBtn.textContent = confirmText;
        cancelBtn.textContent = cancelText;
        
        // Remove previous event listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        // Add new event listeners
        newConfirmBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            confirmCallback();
        });
        
        newCancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.style.display = 'block';
    }

    renderOrdersTable() {
        const tbody = document.getElementById('orders-tbody');
        
        if (this.admin.orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        No orders found
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.admin.orders.map(order => {
            const timeEstimate = this.getStoredTimeEstimate(order);
            const displayStatus = this.getDisplayStatus(order);
            
            return `
            <tr data-order-id="${order.id}">
                <td>#${order.id}</td>
                <td>${order.user_name || 'Guest'}</td>
                <td>${order.item_count || 0} items</td>
                <td>$${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                <td><span class="status-badge status-${displayStatus}">${this.getStatusText(displayStatus)}</span></td>
                <td>${this.admin.utils.formatDate(order.created_at)}</td>
                <td>
                    <div class="time-estimate">
                        ${timeEstimate ? 
                            `<span class="time-badge">${this.formatTimeRemaining(timeEstimate)}</span>` :
                            `<span class="time-badge not-set">Not set</span>`
                        }
                    </div>
                </td>
                <td>
                    <button class="btn-secondary" onclick="admin.ordersModule.viewOrder(${order.id})">View</button>
                </td>
            </tr>
            `;
        }).join('');
    }

    showOrderModal(orderData) {
        const modal = document.getElementById('order-detail-modal');
        const content = document.getElementById('order-detail-content');
        
        // Handle both response formats
        const order = orderData.order || orderData;
        const items = order.items || [];
        const timeEstimate = this.getStoredTimeEstimate(order);
        const displayStatus = this.getDisplayStatus(order);
        const isCompleted = order.status === 'completed';
        const isCancelled = order.status === 'cancelled';
        
        console.log('📦 Order data for modal:', order);
        console.log('📦 Order items:', items);
        
        content.innerHTML = `
            <div class="order-detail">
                <div class="order-header">
                    <h3>Order #${order.id}</h3>
                    <div class="order-status-info">
                        <span class="status-badge status-${displayStatus}">${this.getStatusText(displayStatus)}</span>
                        <div class="time-info">
                            <strong>Ready Time:</strong>
                            ${timeEstimate ? 
                                `<span class="time-remaining">${this.formatTimeRemaining(timeEstimate)}</span>` :
                                `<span class="time-not-set">Not set</span>`
                            }
                        </div>
                    </div>
                </div>
                
                ${!isCompleted && !isCancelled ? `
                <!-- Time Management Section -->
                <div class="time-management-section">
                    <h4>Ready Time</h4>
                    <div class="time-controls">
                        <div class="quick-time-buttons">
                            <button class="time-btn" onclick="admin.ordersModule.setOrderTimeEstimate(${order.id}, 10)">10 min</button>
                            <button class="time-btn" onclick="admin.ordersModule.setOrderTimeEstimate(${order.id}, 15)">15 min</button>
                            <button class="time-btn" onclick="admin.ordersModule.setOrderTimeEstimate(${order.id}, 20)">20 min</button>
                            <button class="time-btn" onclick="admin.ordersModule.setOrderTimeEstimate(${order.id}, 30)">30 min</button>
                            <button class="time-btn" onclick="admin.ordersModule.setOrderTimeEstimate(${order.id}, 45)">45 min</button>
                        </div>
                        
                        <div class="custom-time-input">
                            <input type="number" id="custom-minutes-${order.id}" placeholder="Custom minutes" min="1" max="240">
                            <button class="btn-primary" onclick="admin.ordersModule.setCustomTime(${order.id})">Ready Time</button>
                        </div>
                        
                        ${timeEstimate ? `
                            <div class="time-adjustment">
                                <button class="btn-warning" onclick="admin.ordersModule.adjustTime(${order.id}, -5)">-5 min</button>
                                <button class="btn-warning" onclick="admin.ordersModule.adjustTime(${order.id}, 5)">+5 min</button>
                                <button class="btn-warning" onclick="admin.ordersModule.adjustTime(${order.id}, 10)">+10 min</button>
                                <button class="btn-danger" onclick="admin.ordersModule.clearTimeEstimate(${order.id})">Clear Time</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Order Actions Section -->
                <div class="order-actions-section">
                    <h4>Order Actions</h4>
                    <div class="action-buttons">
                        <button class="btn-ready" onclick="admin.ordersModule.markAsReady(${order.id})">
                            Ready
                        </button>
                        <button class="btn-complete" onclick="admin.ordersModule.completeOrder(${order.id})">
                            Complete Order
                        </button>
                        <button class="btn-cancel" onclick="admin.ordersModule.cancelOrder(${order.id})">
                            Cancel Order
                        </button>
                    </div>
                </div>
                ` : `
                <!-- Completed/Cancelled Order Message -->
                <div class="final-state-message ${isCompleted ? 'completed' : 'cancelled'}">
                    <div class="state-icon">${isCompleted ? '✓' : '✕'}</div>
                    <h4>Order ${isCompleted ? 'Completed' : 'Cancelled'}</h4>
                    <p>This order has been ${isCompleted ? 'completed' : 'cancelled'} and cannot be modified.</p>
                </div>
                `}
                
                <div class="order-info">
                    <div><strong>Customer:</strong> ${order.customer_name || order.user_name || 'Guest'}</div>
                    <div><strong>Email:</strong> ${order.customer_email || order.user_email || 'N/A'}</div>
                    <div><strong>Phone:</strong> ${order.customer_phone || order.user_phone || 'N/A'}</div>
                    <div><strong>Order Type:</strong> ${order.order_type || 'dine-in'}</div>
                    <div><strong>Order Date:</strong> ${this.admin.utils.formatDate(order.created_at)}</div>
                    ${order.notes ? `<div><strong>Notes:</strong> ${order.notes}</div>` : ''}
                    ${order.delivery_address ? `<div><strong>Delivery Address:</strong> ${order.delivery_address}</div>` : ''}
                </div>
                
                <div class="order-items">
                    <h4>Items (${items.length})</h4>
                    ${items.length > 0 ? `
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
                                            <strong>${item.name}</strong>
                                            ${item.variant ? `<br><small>Variant: ${item.variant}</small>` : ''}
                                            ${item.special_instructions ? `<br><small>Instructions: ${item.special_instructions}</small>` : ''}
                                        </td>
                                        <td>${item.quantity}</td>
                                        <td>$${parseFloat(item.price || 0).toFixed(2)}</td>
                                        <td>$${parseFloat(item.total || (item.price * item.quantity) || 0).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3" style="text-align: right;"><strong>Subtotal:</strong></td>
                                    <td><strong>$${parseFloat(order.subtotal_amount || 0).toFixed(2)}</strong></td>
                                </tr>
                                <tr>
                                    <td colspan="3" style="text-align: right;"><strong>Tax:</strong></td>
                                    <td><strong>$${parseFloat(order.tax_amount || 0).toFixed(2)}</strong></td>
                                </tr>
                                <tr>
                                    <td colspan="3" style="text-align: right;"><strong>Total:</strong></td>
                                    <td><strong>$${parseFloat(order.total_amount || 0).toFixed(2)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    ` : `
                        <div class="empty-state">
                            No items found for this order
                        </div>
                    `}
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    setCustomTime(orderId) {
        const input = document.getElementById(`custom-minutes-${orderId}`);
        const minutes = parseInt(input.value);
        
        if (minutes && minutes > 0 && minutes <= 240) {
            this.setOrderTimeEstimate(orderId, minutes);
            input.value = '';
        } else {
            this.admin.utils.showNotification('Please enter a valid number between 1 and 240 minutes', 'error');
        }
    }

    adjustTime(orderId, minutesChange) {
        try {
            const currentEstimate = this.timeEstimates[orderId];
            
            if (!currentEstimate) {
                this.admin.utils.showNotification('No ready time set for this order', 'error');
                return;
            }
            
            const currentTime = new Date(currentEstimate.estimated_completion_time);
            const newTime = new Date(currentTime.getTime() + minutesChange * 60000);
            const newMinutes = Math.round((newTime - new Date()) / 60000);
            
            if (newMinutes <= 0) {
                this.admin.utils.showNotification('Time cannot be adjusted to the past', 'error');
                return;
            }
            
            this.timeEstimates[orderId].estimated_completion_time = newTime.toISOString();
            this.timeEstimates[orderId].estimated_minutes = newMinutes;
            this.saveTimeEstimates();
            
            this.admin.utils.showNotification(`Ready time adjusted by ${minutesChange} minutes`, 'success');
            this.updateOrderTimeDisplay(orderId);
            
            // Refresh modal if open
            const modal = document.getElementById('order-detail-modal');
            if (modal.style.display === 'block') {
                this.viewOrder(orderId);
            }
            
        } catch (error) {
            console.error('Error adjusting time:', error);
            this.admin.utils.showNotification('Error adjusting ready time', 'error');
        }
    }

    clearTimeEstimate(orderId) {
        try {
            delete this.timeEstimates[orderId];
            this.saveTimeEstimates();
            
            this.admin.utils.showNotification('Ready time cleared', 'success');
            this.updateOrderTimeDisplay(orderId);
            
            // Refresh modal if open
            const modal = document.getElementById('order-detail-modal');
            if (modal.style.display === 'block') {
                this.viewOrder(orderId);
            }
            
        } catch (error) {
            console.error('Error clearing ready time:', error);
            this.admin.utils.showNotification('Error clearing ready time', 'error');
        }
    }

    async markAsReady(orderId) {
        try {
            await this.updateOrderStatus(orderId, 'ready');
            this.admin.utils.showNotification('Order marked as ready', 'success');
        } catch (error) {
            console.error('Error marking order as ready:', error);
        }
    }

    async completeOrder(orderId) {
        this.showConfirmationModal(
            'Complete Order',
            'Are you sure you want to mark this order as completed? This action cannot be undone.',
            async () => {
                try {
                    await this.updateOrderStatus(orderId, 'completed');
                    this.admin.utils.showNotification('Order completed successfully', 'success');
                } catch (error) {
                    console.error('Error completing order:', error);
                }
            },
            'Complete Order',
            'Cancel'
        );
    }

    async cancelOrder(orderId) {
        this.showConfirmationModal(
            'Cancel Order',
            'Are you sure you want to cancel this order? This action cannot be undone.',
            async () => {
                try {
                    await this.updateOrderStatus(orderId, 'cancelled');
                    this.admin.utils.showNotification('Order cancelled', 'success');
                } catch (error) {
                    console.error('Error cancelling order:', error);
                }
            },
            'Cancel Order',
            'Keep Order'
        );
    }

    filterOrders() {
        const statusFilter = document.getElementById('order-status-filter').value;
        const dateFilter = document.getElementById('order-date-filter').value;
        
        let filteredOrders = this.admin.orders;
        
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
        
        tbody.innerHTML = orders.map(order => {
            const timeEstimate = this.getStoredTimeEstimate(order);
            const displayStatus = this.getDisplayStatus(order);
            
            return `
            <tr data-order-id="${order.id}">
                <td>#${order.id}</td>
                <td>${order.user_name || 'Guest'}</td>
                <td>${order.item_count || 0} items</td>
                <td>$${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                <td><span class="status-badge status-${displayStatus}">${this.getStatusText(displayStatus)}</span></td>
                <td>${this.admin.utils.formatDate(order.created_at)}</td>
                <td>
                    <div class="time-estimate">
                        ${timeEstimate ? 
                            `<span class="time-badge">${this.formatTimeRemaining(timeEstimate)}</span>` :
                            `<span class="time-badge not-set">Not set</span>`
                        }
                    </div>
                </td>
                <td>
                    <button class="btn-secondary" onclick="admin.ordersModule.viewOrder(${order.id})">View</button>
                </td>
            </tr>
            `;
        }).join('');
    }

    resetFilters() {
        document.getElementById('order-status-filter').value = 'all';
        document.getElementById('order-date-filter').value = '';
        this.renderOrdersTable();
    }
}