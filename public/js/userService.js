/**
 * User Service Module
 * Handles user authentication, registration, and role management
 */
class UserService {
    constructor() {
        this.users = [];
        this.loadUsers();
    }

    async loadUsers() {
        try {
            const response = await $.getJSON('../data/users.json');
            this.users = response;
        } catch (error) {
            console.warn('Could not load remote users.json, falling back to local only.');
            this.users = [];
        }

        const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
        this.users = [...this.users, ...localUsers];
    }

    async ensureUsersLoaded() {
        if (this.users.length === 0) {
            await this.loadUsers();
        }
    }

    async getUserByUsername(username) {
        await this.ensureUsersLoaded();
        return this.users.find(user => user.username === username);
    }

    async validateLogin(username, password) {
        const user = await this.getUserByUsername(username);
        if (user && user.password === password) {
            const { password: _, ...safeUser } = user;
            this.setLoggedInUser(safeUser);
            return true;
        }
        return false;
    }

    async registerUser(username, password, requestedRoles) {
        await this.ensureUsersLoaded();

        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        if (this.users.some(user => user.username === username)) {
            throw new Error('Username already exists');
        }

        // Every user is a "Cuisinier" by default
        const newUser = {
            username,
            password,
            roles: ['Cuisinier'],
            requestedRoles: requestedRoles || []
        };

        // Save to localStorage
        const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
        localUsers.push(newUser);
        localStorage.setItem('localUsers', JSON.stringify(localUsers));

        this.users.push(newUser);
        return newUser;
    }

    async promoteUser(username, newRole) {
        await this.ensureUsersLoaded();
        const user = this.users.find(u => u.username === username);

        if (!user) {
            throw new Error('User not found');
        }

        if (!user.roles.includes(newRole)) {
            user.roles.push(newRole);
            user.requestedRoles = user.requestedRoles.filter(role => role !== newRole);

            // Update localStorage if local user
            const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
            const index = localUsers.findIndex(u => u.username === username);
            if (index >= 0) {
                localUsers[index] = user;
                localStorage.setItem('localUsers', JSON.stringify(localUsers));
            }

            const currentUser = this.getLoggedInUser();
            if (currentUser && currentUser.username === username) {
                const { password: _, ...safeUser } = user;
                this.setLoggedInUser(safeUser);
            }
        }

        return user;
    }

    setLoggedInUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new CustomEvent('userStateChanged', { detail: user }));
    }

    getLoggedInUser() {
        const userJson = localStorage.getItem('user');
        return userJson ? JSON.parse(userJson) : null;
    }

    logoutUser() {
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('userStateChanged', { detail: null }));
    }

    // Role checking
    hasRole(username, role) {
        const user = this.users.find(u => u.username === username);
        return user && user.roles.includes(role);
    }

    isAdmin(username) {
        return this.hasRole(username, 'Admin');
    }

    isChef(username) {
        return this.hasRole(username, 'Chef');
    }

    isTranslator(username) {
        return this.hasRole(username, 'Traducteur');
    }
}

const userService = new UserService();
export default userService;
