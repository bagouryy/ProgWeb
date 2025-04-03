// js/userService.js
class UserService {
    constructor() {
      this.users = [];
    }
  
    async loadUsers() {
      try {
        const response = await $.getJSON('/data/users.json');
        this.users = response;
      } catch (error) {
        console.error('Error loading users:', error);
        this.users = [];
      }
    }
  
    async ensureUsersLoaded() {
      if (this.users.length === 0) {
        await this.loadUsers();
      }
    }
  
    async getUserByUsername(username) {
      await this.loadUsers();
      return this.users.find(u => u.username === username);
    }
  
    async validateLogin(username, password) {
      const user = await this.getUserByUsername(username);
      if (user && user.password === password) {
        this.setLoggedInUser(user); // Add this to store session
        return true;
      }
      return false;
    }
  
    async registerUser(username, password, requestedRoles = []) {
      const newUser = { username, password, roles: [], requestedRoles };
      try {
        const response = await $.ajax({
          url: '/api/users',
          method: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(newUser)
        });
        return response;
      } catch (error) {
        console.error('Registration failed:', error);
        throw error;
      }
    }
  
    async promoteUser(username, newRole) {
      const user = await this.getUserByUsername(username);
      if (!user) throw new Error('User not found');
  
      if (!user.roles.includes(newRole)) {
        user.roles.push(newRole);
        user.requestedRoles = user.requestedRoles.filter(r => r !== newRole);
  
        try {
          const response = await $.ajax({
            url: `/api/users/${encodeURIComponent(username)}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(user)
          });
          return response;
        } catch (err) {
          console.error('Promotion failed:', err);
          throw err;
        }
      }
  
      return user;
    }

    async updateUser(user) {
        try {
          const response = await $.ajax({
            url: `/api/users/${encodeURIComponent(user.username)}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(user)
          });
          return response;
        } catch (err) {
          console.error('User update failed:', err);
          throw err;
        }
      }
      
      async toggleLike(userId, recipeId) {
        try {
          const response = await $.ajax({
            url: `/api/users/${encodeURIComponent(userId)}/likes`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ recipeId })
          });
          return response; // returns { likedPosts, recipe }
        } catch (err) {
          console.error('Error toggling like:', err);
          throw err;
        }
      }
  
    setLoggedInUser(user) {
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('userStateChanged', { detail: user }));
    }
  
    getLoggedInUser() {
      const userJson = localStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    }
  
    isAdmin() {
      const user = this.getLoggedInUser();
      return user && Array.isArray(user.roles) && user.roles.includes('Admin');
    }

    isChef() {
      const user = this.getLoggedInUser();
      return user && Array.isArray(user.roles) && user.roles.includes('Chef');
    }

    isTranslator() {
      const user = this.getLoggedInUser();
      return user && Array.isArray(user.roles) && user.roles.includes('Traducteur');
    }
  }
  
  const userService = new UserService();
  export default userService;
