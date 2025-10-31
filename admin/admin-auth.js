// admin-auth.js
class AdminAuth {
    constructor(admin) {
        this.admin = admin;
    }

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
                this.admin.currentUser = data.admin;
                document.getElementById('admin-name').textContent = this.admin.currentUser.name;
                console.log('✅ Admin verification successful:', this.admin.currentUser.email);
            } else {
                throw new Error(data.message || 'Verification failed');
            }
            
        } catch (error) {
            console.error('❌ Auth error:', error);
            this.logout();
        }
    }

    async checkAuth() {
    console.log('🔐 Auth Debug - localStorage contents:');
    console.log('   - moya_admin_token:', localStorage.getItem('moya_admin_token'));
    console.log('   - moya_admin_user:', localStorage.getItem('moya_admin_user'));
    console.log('   - adminToken:', localStorage.getItem('adminToken'));
    console.log('   - adminUser:', localStorage.getItem('adminUser'));
    
    const adminToken = localStorage.getItem('moya_admin_token');
    const adminUser = localStorage.getItem('moya_admin_user');
    
    if (!adminToken || !adminUser) {
        console.log('❌ No auth tokens found, redirecting to login');
        window.location.href = '/admin-login';
        return;
    }
    // ... rest of checkAuth
}

    logout() {
        localStorage.removeItem('moya_admin_token');
        localStorage.removeItem('moya_admin_user');
        window.location.href = '/admin-login';
    }
}