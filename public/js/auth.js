import userService from './userService.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const messageDiv = document.getElementById('message');

    const showMessage = (message, isError = true) => {
        messageDiv.textContent = message;
        messageDiv.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
        messageDiv.classList.add(
            isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700',
            'rounded-lg', 'p-4'
        );
        setTimeout(() => messageDiv.classList.add('hidden'), 3000);
    };

    const switchTab = (showLogin = true) => {
        loginTab.classList.toggle('bg-primary-500', showLogin);
        loginTab.classList.toggle('text-white', showLogin);
        loginTab.classList.toggle('bg-gray-100', !showLogin);
        loginTab.classList.toggle('text-gray-700', !showLogin);

        registerTab.classList.toggle('bg-primary-500', !showLogin);
        registerTab.classList.toggle('text-white', !showLogin);
        registerTab.classList.toggle('bg-gray-100', showLogin);
        registerTab.classList.toggle('text-gray-700', showLogin);

        loginForm.classList.toggle('hidden', !showLogin);
        registerForm.classList.toggle('hidden', showLogin);
    };

    // Handle login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const success = await userService.validateLogin(username, password);
            if (success) {
                window.location.href = 'index.html';
            } else {
                showMessage('Invalid username or password');
            }
        } catch (error) {
            showMessage(error.message);
        }
    });

    // Handle registration form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const roleChef = document.getElementById('role-chef').checked;
        const roleTranslator = document.getElementById('role-translator').checked;

        const requestedRoles = [];
        if (roleChef) requestedRoles.push('Chef');
        if (roleTranslator) requestedRoles.push('Traducteur');

        try {
            await userService.registerUser(username, password, requestedRoles);
            showMessage('Registration successful! Please log in.', false);
            switchTab(true); // Switch to login tab
        } catch (error) {
            showMessage(error.message);
        }
    });

    // Tab switching
    loginTab.addEventListener('click', () => switchTab(true));
    registerTab.addEventListener('click', () => switchTab(false));
});