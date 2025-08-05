

// Global variables
let currentUser = null;
let isLoading = false;

// DOM elements
const care = document.querySelector('.care');
const authButtons = document.getElementById('auth-buttons');
const userInfo = document.getElementById('user-info');
const userName = document.getElementById('user-name');

// Initialize the app
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing app...');
    
    // Check if user is already logged in
    const user = await getCurrentUser();
    if (user) {
        console.log('User already logged in:', user);
        currentUser = user;
        updateAuthUI();
    }
    
    // Load dynamic statistics
    await loadStatistics();
    
    // Set up event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Toggle menu with cross button
    document.querySelector('.cross-btn').addEventListener('click', function () {
        const menu = document.getElementById('menu');
        menu.classList.toggle('active');
    });

    // Close menu when clicking outside
    window.addEventListener('click', function (event) {
        const menu = document.getElementById('menu');
        const crossBtn = document.querySelector('.cross-btn');
        if (!menu.contains(event.target) && !crossBtn.contains(event.target) && menu.classList.contains('active')) {
            menu.classList.remove('active');
        }
        if (event.target.classList.contains('modal')) {
            if (event.target.id === 'loginModal' || event.target.id === 'registerModal') {
                const type = event.target.id.replace('Modal', '');
                closeAuthModal(type);
            }
        }
    });
}

// Load dynamic statistics from database
async function loadStatistics() {
    try {
        console.log('Loading statistics...');
        const stats = await getStatistics();
        
        // Update the statistics in the hero section
        const peopleHelped = document.querySelector('.stat-item:nth-child(1) h3');
        const donationsMade = document.querySelector('.stat-item:nth-child(2) h3');
        const citiesCovered = document.querySelector('.stat-item:nth-child(3) h3');
        
        if (peopleHelped) {
            peopleHelped.textContent = `${stats.totalReceivers}+`;
        }
        if (donationsMade) {
            donationsMade.textContent = `${stats.totalDonations}+`;
        }
        if (citiesCovered) {
            citiesCovered.textContent = `${stats.totalCities}+`;
        }
        
        console.log('Statistics loaded:', stats);
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

function openAuthModal(type) {
    document.getElementById(`${type}Modal`).style.display = 'flex';
    document.getElementById('menu').classList.remove('active');
}

function closeAuthModal(type) {
    const modal = document.getElementById(`${type}Modal`);
    modal.style.display = 'none';
    modal.querySelector('form').reset();
    
    // Clear any error messages
    const errorMessages = modal.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
}

function switchAuthModal(from, to) {
    closeAuthModal(from);
    openAuthModal(to);
}

// Enhanced password validation function
function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    const characterTypes = [hasUpperCase, hasLowerCase, hasNumbers, hasSymbols];
    const typesCount = characterTypes.filter(Boolean).length;
    
    if (password.length < minLength) {
        return { valid: false, message: `Password must be at least ${minLength} characters long.` };
    }
    
    if (typesCount < 4) {
        return { 
            valid: false, 
            message: `Password must include at least 4 different character types: uppercase letters, lowercase letters, numbers, and symbols.` 
        };
    }
    
    return { valid: true, message: 'Password is strong!' };
}

async function handleAuth(event, type) {
    event.preventDefault();
    
    if (isLoading) return;
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Show loading state
    isLoading = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;

    try {
        console.log(`Handling ${type}...`);
        
        if (type === 'register') {
            const name = form.querySelector('#register-name').value.trim();
            const email = form.querySelector('#register-email').value.trim();
            const password = form.querySelector('#register-password').value.trim();
            const confirm = form.querySelector('#register-confirm').value.trim();

            // Validation
            if (name.length < 2) {
                showError(form, 'Full name must be at least 2 characters long.');
                return;
            }
            if (!validateEmail(email)) {
                showError(form, 'Please enter a valid email address.');
                return;
            }
            
            // Enhanced password validation
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.valid) {
                showError(form, passwordValidation.message);
                return;
            }
            
            if (password !== confirm) {
                showError(form, 'Passwords do not match!');
                return;
            }

            console.log('Attempting registration...');
            // Register with Supabase
            const result = await signUp(email, password, name);
            
            if (result.success) {
                showSuccess('Registration successful! Please check your email to verify your account.');
                closeAuthModal('register');
            } else {
                showError(form, result.error);
            }

        } else if (type === 'login') {
            const email = form.querySelector('#login-email').value.trim();
            const password = form.querySelector('#login-password').value.trim();

            if (!validateEmail(email)) {
                showError(form, 'Please enter a valid email address.');
                return;
            }
            if (password.length < 1) {
                showError(form, 'Please enter your password.');
                return;
            }

            console.log('Attempting login...');
            // Login with Supabase
            const result = await signIn(email, password);
            
            if (result.success) {
                currentUser = result.data.user;
                updateAuthUI();
                closeAuthModal('login');
                showSuccess('Login successful! Welcome back.');
            } else {
                showError(form, result.error);
            }
        }
    } catch (error) {
        console.error('Auth error:', error);
        showError(form, 'An unexpected error occurred. Please try again.');
    } finally {
        // Reset loading state
        isLoading = false;
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function showError(form, message) {
    // Remove existing error messages
    const existingErrors = form.querySelectorAll('.error-message');
    existingErrors.forEach(err => err.remove());
    
    // Create new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorDiv.style.color = '#e74c3c';
    errorDiv.style.fontSize = '14px';
    errorDiv.style.marginTop = '10px';
    
    form.appendChild(errorDiv);
}

function showSuccess(message) {
    // Create a temporary success notification
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

async function logout() {
    try {
        const result = await signOut();
        if (result.success) {
            currentUser = null;
            updateAuthUI();
            showSuccess('Logged out successfully.');
        } else {
            console.error('Logout error:', result.error);
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function updateAuthUI() {
    if (currentUser) {
        // User is logged in
        authButtons.style.display = 'none';
        userInfo.style.display = 'flex';
        userName.textContent = currentUser.user_metadata?.full_name || currentUser.email || 'User';
        
        // Update navigation menu
        const menu = document.getElementById('menu');
        menu.classList.remove('active');
    } else {
        // User is not logged in
        authButtons.style.display = 'flex';
        userInfo.style.display = 'none';
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Donation handling functions
function openModal(type) {
    if (!currentUser) {
        showError(document.body, 'Please log in to make a donation.');
        openAuthModal('login');
        return;
    }
    
    // Your existing modal logic here
    console.log('Opening modal for:', type);
}

function submitDonation(event) {
    event.preventDefault();
    
    if (!currentUser) {
        showError(event.target, 'Please log in to make a donation.');
        return;
    }
    
    // Your existing donation submission logic here
    console.log('Submitting donation...');
}

// Animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);