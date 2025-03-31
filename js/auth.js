import userService from './userService.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const messageDiv = document.getElementById('message');

    // Utility to show message
    const showMessage = (message, isError = true) => {
        messageDiv.textContent = message;
        messageDiv.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');

        messageDiv.classList.add(
            isError ? 'bg-red-100' : 'bg-green-100',
            isError ? 'text-red-700' : 'text-green-700',
            'rounded-lg', 'p-4', 'animate-fade-in'
        );

        setTimeout(() => messageDiv.classList.add('hidden'), 3000);
    };

    // Switch Login/Register tabs and styles
    const switchTab = (showLogin = true) => {
        loginTab.classList.toggle('bg-primary-600', showLogin);
        loginTab.classList.toggle('text-white', showLogin);
        loginTab.classList.toggle('bg-gray-100', !showLogin);
        loginTab.classList.toggle('text-gray-700', !showLogin);

        registerTab.classList.toggle('bg-primary-600', !showLogin);
        registerTab.classList.toggle('text-white', !showLogin);
        registerTab.classList.toggle('bg-gray-100', showLogin);
        registerTab.classList.toggle('text-gray-700', showLogin);

        loginForm.classList.toggle('hidden', !showLogin);
        registerForm.classList.toggle('hidden', showLogin);
    };

    // Handle login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (!username || !password) {
            showMessage('Please fill in both fields');
            return;
        }

        try {
            const user = await userService.validateLogin(username, password);
            if (user) {
                localStorage.setItem('user', JSON.stringify(user)); // Store user in localStorage
                window.location.href = 'index.html';
            } else {
                showMessage('Invalid username or password');
            }
        } catch (error) {
            showMessage(error.message || 'An error occurred');
        }
    });

    // Handle register
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value.trim();
        const roleChef = document.getElementById('role-chef').checked;
        const roleTranslator = document.getElementById('role-translator').checked;

        const requestedRoles = [];
        if (roleChef) requestedRoles.push('Chef');
        if (roleTranslator) requestedRoles.push('Traducteur');

        if (!username || !password) {
            showMessage('Username and password are required');
            return;
        }

        try {
            const user = await userService.registerUser(username, password, requestedRoles);
            localStorage.setItem('user', JSON.stringify(user));
            window.location.href = 'index.html'; 
        } catch (error) {
            showMessage(error.message || 'Registration failed');
        }
    });

    // Tab switching
    loginTab.addEventListener('click', () => switchTab(true));
    registerTab.addEventListener('click', () => switchTab(false));
});
