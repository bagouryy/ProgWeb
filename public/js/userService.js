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
            const response = await fetch('../data/users.json');
            this.users = await response.json();
            // Also load any locally registered users
            const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
            this.users = [...this.users, ...localUsers];
        } catch (error) {
            console.error('Error loading users:', error);
            this.users = [];
        }
    }

    async getUserByUsername(username) {
        await this.ensureUsersLoaded();
        return this.users.find(user => user.username === username);
    }

    async validateLogin(username, password) {
        const user = await this.getUserByUsername(username);
        if (user && user.password === password) {
            // Remove sensitive data before storing
            const { password: _, ...safeUser } = user;
            this.setLoggedInUser(safeUser);
            return true;
        }
        return false;
    }

    async registerUser(username, password, requestedRoles) {
        await this.ensureUsersLoaded();
        
        // Check if username already exists
        if (this.users.some(user => user.username === username)) {
            throw new Error('Username already exists');
        }

        // Validate input
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        const newUser = {
            username,
            password,
            roles: [],
            requestedRoles: requestedRoles || []
        };

        // Store in localStorage to persist
        const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
        localUsers.push(newUser);
        localStorage.setItem('localUsers', JSON.stringify(localUsers));

        // Add to in-memory users
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
            
            // Update in localStorage if it's a local user
            const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
            const localUserIndex = localUsers.findIndex(u => u.username === username);
            if (localUserIndex >= 0) {
                localUsers[localUserIndex] = user;
                localStorage.setItem('localUsers', JSON.stringify(localUsers));
            }
            
            // Update session if this is the current user
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
        // Dispatch event for other components to react to login state changes
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

    // Helper method to ensure users are loaded
    async ensureUsersLoaded() {
        if (this.users.length === 0) {
            await this.loadUsers();
        }
    }

    // Utility methods for role checking
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

// Create and export a singleton instance
const userService = new UserService();
export default userService;