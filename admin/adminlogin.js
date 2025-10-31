class AdminLogin {
    constructor() {
        this.API_BASE = 'http://localhost:3000';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingSession();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                this.handleLogin(e);
            });
        }

        // Registration form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                this.handleRegistration(e);
            });
        }

        console.log('Event listeners setup complete');
    }

    async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');
    const submitBtn = document.querySelector('#loginForm .btn-login');

    // Show loading state
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';
    }
    
    if (errorElement) {
        errorElement.style.display = 'none';
        errorElement.textContent = '';
    }

    try {
        console.log('🔄 Attempting login...');
        
        // Use API login instead of hardcoded
        const response = await fetch(`${this.API_BASE}/api/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email: email, 
                password: password 
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log('📦 Login response:', data);

   // In your adminlogin.js - Replace the success handler with this:
if (data.success) {
    console.log('✅ API login successful');
    console.log('👤 User data:', data.user);
    console.log('🔑 Token:', data.token);
    
    // Store in localStorage
    localStorage.setItem('moya_admin_user', JSON.stringify(data.user));
    localStorage.setItem('moya_admin_token', data.token);
    
    this.showMessage('Login successful! Redirecting to admin panel...', 'success');
    
    console.log('🔄 Starting redirect process...');
    
    // Force redirect immediately without delay
    setTimeout(() => {
        console.log('📍 Current URL:', window.location.href);
        console.log('📍 Redirecting to:', '/admin');
        
        // Use multiple methods to ensure redirect works
        window.location.href = '/admin';
        window.location.replace('/admin');
        
        // Fallback after 2 seconds
        setTimeout(() => {
            if (window.location.href.includes('admin-login')) {
                console.log('❌ Redirect failed, forcing reload...');
                window.location.href = '/admin';
            }
        }, 2000);
        
    }, 500);
    
} else {
    throw new Error(data.message || 'Login failed');
}

    } catch (error) {
        console.error('Login error:', error);
        
        // Fallback to hardcoded login if API fails
        if (email === 'admin@moyacafe.com' && password === 'admin2025') {
            console.log('🔄 Using fallback login...');
            
            const adminUser = {
                id: 1,
                name: 'Main Administrator',
                email: email,
                role: 'admin'
            };

            // Store in localStorage
            localStorage.setItem('moya_admin_user', JSON.stringify(adminUser));
            localStorage.setItem('moya_admin_token', '1'); // Use user ID as simple token
            
            this.showMessage('Login successful! Redirecting to admin panel...', 'success');
            
            setTimeout(() => {
                console.log('🔄 Redirecting to admin dashboard...');
                window.location.href = '/admin';
            }, 1000);
        } else {
            if (errorElement) {
                errorElement.textContent = error.message || 'Invalid email or password';
                errorElement.style.display = 'block';
            }
        }
    } finally {
        // Reset button state
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login to Dashboard';
        }
    }
}

    async handleRegistration(e) {
        e.preventDefault();
        
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const role = document.getElementById('reg-role').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        
        const errorElement = document.getElementById('register-error');
        const submitBtn = document.querySelector('#registerForm .btn-login');

        // Validation
        if (password !== confirmPassword) {
            if (errorElement) {
                errorElement.textContent = 'Passwords do not match';
                errorElement.style.display = 'block';
            }
            return;
        }

        if (password.length < 6) {
            if (errorElement) {
                errorElement.textContent = 'Password must be at least 6 characters';
                errorElement.style.display = 'block';
            }
            return;
        }

        // Show loading state
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating Account...';
        }
        
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }

        try {
            // TEMPORARY: Just simulate registration and auto-login
            console.log('🔄 Creating admin account...');
            
            const adminUser = {
                id: Date.now(),
                name: name,
                email: email,
                role: 'admin'
            };

            localStorage.setItem('moya_admin_user', JSON.stringify(adminUser));
            localStorage.setItem('moya_admin_token', 'admin-token-' + Date.now());
            
            this.showMessage('Account created successfully! Logging you in...', 'success');
            
            setTimeout(() => {
                console.log('🔄 Redirecting to admin dashboard...');
                window.location.href = '/admin'; // Changed from admin.html to /admin
            }, 1500);

        } catch (error) {
            console.error('Registration error:', error);
            if (errorElement) {
                errorElement.textContent = error.message || 'Registration failed. Please try again.';
                errorElement.style.display = 'block';
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Admin Account';
            }
        }
    }

    switchTab(tab) {
        console.log('Switching to tab:', tab);
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const activeTabBtn = document.querySelector(`.tab-btn[onclick="adminLogin.switchTab('${tab}')"]`);
        if (activeTabBtn) {
            activeTabBtn.classList.add('active');
        }
        
        const activeTabContent = document.getElementById(tab + '-tab');
        if (activeTabContent) {
            activeTabContent.classList.add('active');
        }
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.remove();
            }
        }, 3000);
    }

    checkExistingSession() {
        const adminUser = localStorage.getItem('moya_admin_user');
        const adminToken = localStorage.getItem('moya_admin_token');
        
        if (adminUser && adminToken) {
            console.log('🔄 Found existing session, redirecting...');
            // For now, just redirect if we have stored credentials
            window.location.href = '/admin'; // Changed from admin.html to /admin
        }
    }
}

// Initialize admin login when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminLogin = new AdminLogin();
    console.log('AdminLogin initialized');
});