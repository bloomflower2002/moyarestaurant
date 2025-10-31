// admin-users.js
class AdminUsers {
    constructor(admin) {
        this.admin = admin;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // User Registration Form
        document.getElementById('user-registration-form').addEventListener('submit', (e) => {
            this.handleUserRegistration(e);
        });

        // Search functionality
        document.getElementById('search-users').addEventListener('input', () => {
            this.searchUsers();
        });

        // Export users
        document.getElementById('export-users').addEventListener('click', () => {
            this.exportUsers();
        });
    }

    async loadUsers() {
        try {
            const data = await this.admin.makeApiCall('/api/admin/users');
            this.admin.users = data.users || data;
            this.renderUsersTable();
            
        } catch (error) {
            console.error('Error loading users:', error);
            this.admin.utils.showNotification('Error loading users', 'error');
        }
    }

    renderUsersTable() {
        const tbody = document.getElementById('users-tbody');
        
        if (this.admin.users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        No users registered yet
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.admin.users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="status-badge role-${user.role}">${user.role}</span></td>
                <td>${this.admin.utils.formatDate(user.created_at)}</td>
                <td>${user.order_count || 0}</td>
                <td>
                    <button class="btn-secondary" onclick="admin.usersModule.viewUser(${user.id})">View</button>
                    <button class="btn-danger" onclick="admin.usersModule.deleteUser(${user.id})">Delete</button>
                    ${user.role !== 'admin' ? 
                        `<button class="btn-primary" onclick="admin.usersModule.promoteUser(${user.id})">Make Admin</button>` : 
                        ''
                    }
                </td>
            </tr>
        `).join('');
    }

    async viewUser(userId) {
        try {
            const userData = await this.admin.makeApiCall(`/api/admin/users/${userId}`);
            this.showUserModal(userData);
        } catch (error) {
            console.error('Error loading user details:', error);
            this.admin.utils.showNotification('Error loading user details', 'error');
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
                    <p><strong>Joined:</strong> ${this.admin.utils.formatDate(user.created_at)}</p>
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
            await this.admin.makeApiCall(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });
            
            this.admin.utils.showNotification('User deleted successfully', 'success');
            this.loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            this.admin.utils.showNotification('Error deleting user', 'error');
        }
    }

    async promoteUser(userId) {
        if (!confirm('Are you sure you want to make this user an administrator?')) return;

        try {
            await this.admin.makeApiCall(`/api/admin/users/${userId}/promote`, {
                method: 'PUT'
            });
            
            this.admin.utils.showNotification('User promoted to administrator', 'success');
            this.loadUsers();
        } catch (error) {
            console.error('Error promoting user:', error);
            this.admin.utils.showNotification('Error promoting user', 'error');
        }
    }

    async handleUserRegistration(e) {
        e.preventDefault();
        
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        
        if (password !== confirmPassword) {
            this.admin.utils.showNotification('Passwords do not match', 'error');
            return;
        }

        const formData = {
            name: document.getElementById('reg-name').value.trim(),
            email: document.getElementById('reg-email').value.trim(),
            phone: document.getElementById('reg-phone').value.trim(),
            role: document.getElementById('reg-role').value,
            password: password
        };

        if (formData.password.length < 6) {
            this.admin.utils.showNotification('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            await this.admin.makeApiCall('/api/admin/users', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            this.admin.utils.showNotification(`User ${formData.name} created successfully!`, 'success');
            this.closeUserRegistration();
            this.loadUsers();
        } catch (error) {
            console.error('Error creating user:', error);
            this.admin.utils.showNotification('Error creating user', 'error');
        }
    }

    searchUsers() {
        const query = document.getElementById('search-users').value.toLowerCase();
        const filteredUsers = this.admin.users.filter(user => 
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
                <td><span class="status-badge role-${user.role}">${user.role}</span></td>
                <td>${this.admin.utils.formatDate(user.created_at)}</td>
                <td>${user.order_count || 0}</td>
                <td>
                    <button class="btn-secondary" onclick="admin.usersModule.viewUser(${user.id})">View</button>
                    <button class="btn-danger" onclick="admin.usersModule.deleteUser(${user.id})">Delete</button>
                    ${user.role !== 'admin' ? 
                        `<button class="btn-primary" onclick="admin.usersModule.promoteUser(${user.id})">Make Admin</button>` : 
                        ''
                    }
                </td>
            </tr>
        `).join('');
    }

    async exportUsers() {
        try {
            const usersData = await this.admin.makeApiCall('/api/admin/users');
            const csvContent = this.admin.utils.convertToCSV(usersData.users);
            this.admin.utils.downloadCSV(csvContent, 'moya-users.csv');
            this.admin.utils.showNotification('Users exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting users:', error);
            this.admin.utils.showNotification('Error exporting users', 'error');
        }
    }

    openUserRegistration() {
        document.getElementById('user-registration-modal').style.display = 'block';
    }

    closeUserRegistration() {
        document.getElementById('user-registration-modal').style.display = 'none';
        document.getElementById('user-registration-form').reset();
    }

    viewAdminAccounts() {
        const adminUsers = this.admin.users.filter(user => user.role === 'admin');
        this.admin.utils.showNotification(`Found ${adminUsers.length} admin accounts`, 'info');
    }
}