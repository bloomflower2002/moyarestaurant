// admin-utils.js
class AdminUtils {
    constructor(admin) {
        this.admin = admin;
        this.initializeNotifications();
    }

    initializeNotifications() {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = this.getNotificationStyles();
        document.head.appendChild(styleSheet);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Add styles and functionality
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
        
        // Close on click
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        });
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatTime(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    async exportUsers() {
        try {
            const usersData = await this.admin.makeApiCall('/api/admin/users');
            const csvContent = this.convertToCSV(usersData.users);
            this.downloadCSV(csvContent, 'moya-users.csv');
            this.showNotification('Users exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting users:', error);
            this.showNotification('Error exporting users', 'error');
        }
    }

    convertToCSV(users) {
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Join Date', 'Order Count'];
        const rows = users.map(user => [
            user.id,
            `"${user.name}"`,
            `"${user.email}"`,
            `"${user.phone || 'N/A'}"`,
            `"${user.role}"`,
            `"${this.formatDate(user.created_at)}"`,
            user.order_count || 0
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
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

    getNotificationStyles() {
        return `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            .notification {
                transition: all 0.3s ease;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                margin-left: 10px;
                float: right;
            }
            .notification-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
        `;
    }
}