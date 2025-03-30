// js/userService.js
class UserService {
    constructor() {
      this.users = [];
      this.loadUsers();
    }
  
    async loadUsers() {
      try {
        const response = await $.getJSON('/data/users.json');
        this.users = response;
      } catch (error) {
        console.error('Error loading users from server:', error);
        this.users = [];
      }
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
  
    async registerUser(username, password, requestedRoles = []) {
      await this.ensureUsersLoaded();
      if (!username || !password) throw new Error('Username and password are required');
      if (this.users.some(user => user.username === username)) throw new Error('Username already exists');
  
      const newUser = {
        username,
        password,
        roles: [],
        requestedRoles
      };
  
      try {
        await $.ajax({
          url: '/api/users',
          method: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(newUser)
        });
        this.users.push(newUser);
      } catch (error) {
        console.error('Failed to save user to server:', error);
      }
  
      return newUser;
    }
  
    async promoteUser(username, newRole) {
      await this.ensureUsersLoaded();
      const user = this.users.find(u => u.username === username);
      if (!user) throw new Error('User not found');
  
      if (!user.roles.includes(newRole)) {
        user.roles.push(newRole);
        user.requestedRoles = user.requestedRoles.filter(r => r !== newRole);
  
        try {
          await $.ajax({
            url: '/api/users',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(user)
          });
        } catch (error) {
          console.warn('Could not update user to server:', error);
        }
  
        const currentUser = this.getLoggedInUser();
        if (currentUser?.username === username) {
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
  
    hasRole(username, role) {
      const sessionUser = this.getLoggedInUser();
      if (sessionUser?.username === username) {
        return sessionUser.roles.includes(role);
      }
  
      const user = this.users.find(u => u.username === username);
      return user?.roles.includes(role);
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
  
    isPartiallyTranslated(recipe) {
      return Boolean(recipe.nameFR || recipe.ingredientsFR?.length || recipe.stepsFR?.length);
    }
  
    isFullyTranslated(recipe) {
      return Boolean(recipe.nameFR && recipe.ingredientsFR?.length && recipe.stepsFR?.length);
    }
  }
  
  const userService = new UserService();
  export default userService;