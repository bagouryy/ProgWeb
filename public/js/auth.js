import userService from './userService.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginSubmit = document.getElementById('login-submit');
    const registerSubmit = document.getElementById('register-submit');
    const messageDiv = document.getElementById('message');

    const showMessage = (message, isError = true) => {
        messageDiv.textContent = message;
        messageDiv.classList.toggle('text-red-500', isError);
        messageDiv.classList.toggle('text-green-500', !isError);
        messageDiv.classList.remove('hidden');
        setTimeout(() => messageDiv.classList.add('hidden'), 3000);
    };

    const handleLogin = async () => {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const isValid = await userService.validateLogin(username, password);
            if (isValid) {
                showMessage('Login successful!', false);
                setTimeout(() => window.location.href = 'index.html', 1000);
            } else {
                showMessage('Invalid username or password.');
            }
        } catch (error) {
            showMessage(error.message);
        }
    };

    const handleRegister = async () => {
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const roleChef = document.getElementById('role-chef').checked;
        const roleTranslator = document.getElementById('role-translator').checked;

        try {
            const requestedRoles = [];
            if (roleChef) requestedRoles.push('DemandeChef');
            if (roleTranslator) requestedRoles.push('DemandeTraducteur');

            await userService.registerUser(username, password, requestedRoles);
            showMessage('Registration successful!', false);
            setTimeout(() => {
                loginTab.click();
            }, 1500);
        } catch (error) {
            showMessage(error.message);
        }
    };

    loginTab.addEventListener('click', () => {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    });

    registerTab.addEventListener('click', () => {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    });

    loginSubmit.addEventListener('click', handleLogin);
    registerSubmit.addEventListener('click', handleRegister);
});