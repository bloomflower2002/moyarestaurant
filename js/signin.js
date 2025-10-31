// Frontend/js/signin.js - ENHANCED VERSION WITH PASSWORD STRENGTH VALIDATION

console.log('🚀 Signin.js loaded - using absolute URLs');

const API_BASE = 'http://localhost:3000';

// Password strength requirements
const PASSWORD_REQUIREMENTS = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
};

// Show/hide forms
function showLoginForm() {
    hideAllForms();
    document.getElementById('login-form').classList.remove('hidden');
}

function showRegisterForm() {
    hideAllForms();
    document.getElementById('register-form').classList.remove('hidden');
    // Reset password strength indicator
    updatePasswordStrength('');
}

function showForgotPassword() {
    hideAllForms();
    document.getElementById('forgot-password-form').classList.remove('hidden');
}

function showVerificationPending(email) {
    hideAllForms();
    document.getElementById('pending-email').textContent = email;
    document.getElementById('verification-pending').classList.remove('hidden');
}

function hideAllForms() {
    const forms = document.querySelectorAll('.form-container');
    forms.forEach(form => form.classList.add('hidden'));
}

// Password visibility toggle
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.parentElement.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Password strength validation function
function validatePasswordStrength(password) {
    const errors = [];
    const suggestions = [];

    // Check length
    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
        errors.push(`at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
    }

    // Check uppercase
    if (PASSWORD_REQUIREMENTS.requireUppercase && !/(?=.*[A-Z])/.test(password)) {
        errors.push('one uppercase letter (A-Z)');
    }

    // Check lowercase
    if (PASSWORD_REQUIREMENTS.requireLowercase && !/(?=.*[a-z])/.test(password)) {
        errors.push('one lowercase letter (a-z)');
    }

    // Check numbers
    if (PASSWORD_REQUIREMENTS.requireNumbers && !/(?=.*\d)/.test(password)) {
        errors.push('one number (0-9)');
    }

    // Check special characters
    if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
        errors.push('one special character (!@#$%^&* etc.)');
    }

    // Google-suggested security recommendations
    if (password.length > 0) {
        // Check for common patterns
        if (/(.)\1{2,}/.test(password)) {
            suggestions.push('Avoid repeated characters (e.g., "aaa")');
        }
        
        if (/12345|abcde|qwerty/.test(password.toLowerCase())) {
            suggestions.push('Avoid sequential patterns (e.g., "12345", "abcde")');
        }
        
        if (password.toLowerCase().includes('password')) {
            suggestions.push('Avoid using the word "password"');
        }
        
        // Check for personal information patterns (basic check)
        const email = document.getElementById('register-email')?.value || '';
        const name = document.getElementById('register-name')?.value || '';
        if (email && password.toLowerCase().includes(email.split('@')[0].toLowerCase())) {
            suggestions.push('Avoid using your email in your password');
        }
        if (name && password.toLowerCase().includes(name.toLowerCase())) {
            suggestions.push('Avoid using your name in your password');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        suggestions,
        score: calculatePasswordScore(password)
    };
}

// Calculate password strength score
function calculatePasswordScore(password) {
    let score = 0;
    
    if (!password) return 0;
    
    // Length points
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (password.length >= 16) score += 10;
    
    // Character variety points
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    
    // Deductions for poor patterns
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated chars
    if (/12345|abcde|qwerty/.test(password.toLowerCase())) score -= 15; // Sequences
    
    return Math.max(0, Math.min(100, score));
}

// Update password strength indicator in real-time
function updatePasswordStrength(password) {
    const strengthIndicator = document.getElementById('password-strength');
    const strengthText = document.getElementById('password-strength-text');
    const suggestionsList = document.getElementById('password-suggestions');
    
    if (!strengthIndicator || !strengthText) return;
    
    const validation = validatePasswordStrength(password);
    const score = validation.score;
    
    // Update strength bar
    strengthIndicator.style.width = `${score}%`;
    
    // Update colors and text based on score
    if (password.length === 0) {
        strengthIndicator.style.backgroundColor = '#ddd';
        strengthText.textContent = 'Enter a password';
        strengthText.style.color = '#666';
    } else if (score < 40) {
        strengthIndicator.style.backgroundColor = '#ff4444';
        strengthText.textContent = 'Weak';
        strengthText.style.color = '#ff4444';
    } else if (score < 70) {
        strengthIndicator.style.backgroundColor = '#ffbb33';
        strengthText.textContent = 'Fair';
        strengthText.style.color = '#ffbb33';
    } else if (score < 90) {
        strengthIndicator.style.backgroundColor = '#00C851';
        strengthText.textContent = 'Good';
        strengthText.style.color = '#00C851';
    } else {
        strengthIndicator.style.backgroundColor = '#007E33';
        strengthText.textContent = 'Strong';
        strengthText.style.color = '#007E33';
    }
    
    // Update suggestions
    if (suggestionsList) {
        suggestionsList.innerHTML = '';
        if (password.length > 0) {
            validation.suggestions.forEach(suggestion => {
                const li = document.createElement('li');
                li.textContent = suggestion;
                li.className = 'text-orange-500 text-xs';
                suggestionsList.appendChild(li);
            });
        }
    }
}

// Enhanced registration function with password strength validation
async function register() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    console.log('📝 Register function called with:', { name, email });
    
    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    // Password strength validation
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
        const errorMessage = `Password must contain:\n• ${passwordValidation.errors.join('\n• ')}`;
        alert(errorMessage);
        return;
    }
    
    // Show password suggestions if any
    if (passwordValidation.suggestions.length > 0) {
        const suggestionMessage = `Security suggestions:\n• ${passwordValidation.suggestions.join('\n• ')}\n\nYou can still proceed, but consider these suggestions for better security.`;
        if (!confirm(suggestionMessage + '\n\nContinue with this password?')) {
            return; // User chose to cancel
        }
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    try {
        console.log('🔄 Attempting to fetch:', `${API_BASE}/api/auth/signup`);
        
        const response = await fetch(`${API_BASE}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                name: name, 
                email: email, 
                password: password 
            })
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Response data:', data);

        // DEBUG: Log all properties of the response
        console.log('🔍 Response properties:');
        for (const key in data) {
            console.log(`  ${key}:`, data[key]);
        }
        
        // FIXED: Handle different possible response structures
        if (response.status === 201 || data.success || data.message?.includes('success') || data.message?.includes('registered')) {
            // Registration successful - show message and redirect to login
            console.log('✅ Registration successful!');
            alert(data.message || 'Registration successful!');
            
            // FIXED: Clear form fields manually instead of using .reset()
            document.getElementById('register-name').value = '';
            document.getElementById('register-email').value = '';
            document.getElementById('register-password').value = '';
            document.getElementById('register-confirm-password').value = '';
            
            // Reset password strength indicator
            updatePasswordStrength('');
            
            // Redirect to login after a brief delay
            setTimeout(() => {
                showLoginForm();
                alert('Please login with your new account');
            }, 1500);
        } else {
            // Registration failed
            alert('Registration failed: ' + (data.message || data.error || 'Unknown error'));
        }
        
    } catch (error) {
        console.error('💥 Registration error details:', error);
        alert('Registration failed: ' + error.message);
    }
}

// After successful login in signin.js
function handleSuccessfulLogin(user) {
    // Check if there's a redirect parameter
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    const total = urlParams.get('total');
    
    if (redirect === 'payment' && total) {
        // Redirect to payment with the total
        window.location.href = `payment.html?total=${total}`;
    } else {
        // Default redirect
        window.location.href = '/order.html';
    }
}

// Enhanced login function with absolute URLs - UPDATED TO USE handleSuccessfulLogin
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    console.log('🔐 Login attempt for:', email);
    
    // Basic validation
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    try {
        console.log('🔄 Making fetch request to:', `${API_BASE}/api/auth/login`);
        
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email: email, 
                password: password 
            })
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Login response data:', data);
        
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // 🛒 CRITICAL FIX: Update cart identifier to user ID
            const userId = data.user.id.toString();
            localStorage.setItem('cartIdentifier', userId);
            console.log('🔄 Updated cart identifier to user ID:', userId);
            
            console.log('✅ Login successful, token stored');
            
            // Check if we came from payment redirect
            const urlParams = new URLSearchParams(window.location.search);
            const redirect = urlParams.get('redirect');
            const total = urlParams.get('total');
            
            if (redirect === 'payment') {
                // Redirect back to payment with user cart
                console.log('💰 Redirecting back to payment after login');
                window.location.href = `payment.html?total=${total}`;
            } else {
                // USE THE REDIRECT HANDLER FOR NORMAL LOGIN
                handleSuccessfulLogin(data.user);
            }
            
        } else {
            if (data.requiresVerification) {
                alert('Please verify your email before logging in. Check your email for the verification link.');
            } else {
                alert('Login failed: ' + data.message);
            }
        }
        
    } catch (error) {
        console.error('💥 Login error details:', error);
        alert('Login failed: ' + error.message);
    }
}

// OAuth functions
function loginWithGoogle() {
    console.log('Google login clicked');
    
    // Get redirect parameter and pass it to Google OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    
    let oauthUrl = `${API_BASE}/auth/google`;
    if (redirect === 'payment') {
        oauthUrl += '?redirect=payment';
    }
    
    window.location.href = oauthUrl;
}

function loginWithFacebook() {
    console.log('Facebook login clicked');
    alert('Facebook login coming soon!');
}

// Email verification function - UPDATED TO USE handleSuccessfulLogin
async function verifyEmail(token) {
    try {
        console.log('📧 Verifying email with token:', token);
        
        const response = await fetch(`${API_BASE}/api/auth/verify-email?token=${token}`);
        const data = await response.json();
        
        console.log('📧 Verification response:', data);
        
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // 🛒 FIX: UPDATE CART IDENTIFIER TO USER ID AFTER VERIFICATION
            const userId = data.user.id;
            localStorage.setItem('cartIdentifier', userId);
            console.log('🔄 Updated cart identifier to user ID:', userId);
            
            console.log('✅ Email verified successfully!');
            
            // USE THE REDIRECT HANDLER FOR CONSISTENCY
            handleSuccessfulLogin(data.user);
            
        } else {
            alert('❌ Email verification failed: ' + data.message);
        }
    } catch (error) {
        console.error('💥 Verification error:', error);
        alert('❌ Email verification failed: Cannot connect to server.');
    }
}

// Resend verification email
async function resendVerification() {
    const email = document.getElementById('pending-email').textContent;
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/resend-verification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Verification email sent! Please check your inbox.');
        } else {
            alert('Error: ' + data.message);
        }
        
    } catch (error) {
        console.error('Resend verification error:', error);
        alert('Failed to resend verification email.');
    }
}

// Reset password function
async function resetPassword() {
    const email = document.getElementById('forgot-email').value;
    
    if (!email) {
        alert('Please enter your email');
        return;
    }
    
    alert('Password reset functionality coming soon!');
    showLoginForm();
}

// Test server connection
async function testConnection() {
    try {
        console.log('Testing server connection to:', `${API_BASE}/api/test`);
        const response = await fetch(`${API_BASE}/api/test`);
        const data = await response.json();
        console.log('✅ Server test response:', data);
        return true;
    } catch (error) {
        console.error('❌ Server connection test failed:', error);
        return false;
    }
}

// Check for verification token in URL and auto-verify
function checkVerificationToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
        console.log('🔑 Verification token found in URL, auto-verifying...');
        verifyEmail(token);
    }
}

// Debug function to check current redirect state
function debugRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    
    console.log('🔍 DEBUG REDIRECT:');
    console.log('Current URL:', window.location.href);
    console.log('Redirect parameter:', redirect);
    console.log('User in localStorage:', localStorage.getItem('user'));
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded - testing server connection');
    
    // Test if server is reachable
    testConnection().then(isConnected => {
        if (isConnected) {
            console.log('✅ Server is connected and responding');
        } else {
            console.log('❌ Server is not responding');
        }
    });
    
    // Check for email verification token
    checkVerificationToken();
    
    // Show login form by default
    showLoginForm();
    
    // Debug: log current redirect state
    debugRedirect();
    
    // Add real-time password strength monitoring
    const passwordInput = document.getElementById('register-password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function(e) {
            updatePasswordStrength(e.target.value);
        });
    }
});

// Export functions for global access
window.login = login;
window.register = register;
window.loginWithGoogle = loginWithGoogle;
window.loginWithFacebook = loginWithFacebook;
window.resetPassword = resetPassword;
window.resendVerification = resendVerification;
window.togglePassword = togglePassword;
window.showLoginForm = showLoginForm;
window.showRegisterForm = showRegisterForm;
window.showForgotPassword = showForgotPassword;
window.debugRedirect = debugRedirect;