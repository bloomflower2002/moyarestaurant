function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const icon = input.nextElementSibling.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

function showLoginForm()         { toggle('login-form'); }
function showRegisterForm()      { toggle('register-form'); }
function showForgotPassword()    { toggle('forgot-password-form'); }
function showVerificationMessage(){ toggle('verification-message'); }
function showSuccessMessage()    { toggle('success-message'); }

function toggle(id) {
  document.querySelectorAll('.form-container').forEach(f => f.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function register() {
  const name     = document.getElementById('register-name').value;
  const email    = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirm  = document.getElementById('register-confirm-password').value;

  if (!name || !email || !password || !confirm) return alert('Please fill in all fields');
  if (password !== confirm)      return alert('Passwords do not match');
  if (password.length < 6)       return alert('Password must be at least 6 characters long');
  showVerificationMessage();
}

function resetPassword() {
  const email = document.getElementById('forgot-email').value;
  email ? (alert('Password reset link sent!'), showLoginForm()) : alert('Please enter your email');
}

function logout() {
  showLoginForm();
}

function loginWithGoogle()  { alert('Google OAuth login would be implemented here'); showSuccessMessage(); }
function loginWithFacebook(){ alert('Facebook OAuth login would be implemented here'); showSuccessMessage(); }

/* ✅ CLEAN SINGLE LOGIN FUNCTION WITH REDIRECT */
function login() {
  const email    = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  if (email && password) {
    localStorage.setItem("loggedIn", "true");

    // Redirect to previous page or fallback to index.html
    const redirectUrl = localStorage.getItem('redirectAfterLogin') || 'index.html';
    localStorage.removeItem('redirectAfterLogin');
    window.location.href = redirectUrl;
  } else {
    alert('Please fill in all fields');
  }
}
function login() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  if (email && password) {
    // store login state & basic data
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userEmail", email);
    // you might also store a name if you collected it during register
    localStorage.setItem("userName", "Guest User"); 

    // redirect to the profile page
    window.location.href = "user.html";
  } else {
    alert('Please fill in all fields');
  }
}


