import userService from './userService.js';

const Navigation = {
  init: (navMenuId, userInfoId, logoutButtonId, languageToggleId) => {
    const navMenu = document.getElementById(navMenuId);
    const userInfo = document.getElementById(userInfoId);
    const logoutButton = document.getElementById(logoutButtonId);
    const languageToggle = document.getElementById(languageToggleId);

    const updateNav = async () => {
      const user = userService.getLoggedInUser();
      if (!user) {
        window.location.href = 'login.html';
        return;
      }

      userInfo.textContent = user.username;

      const lang = localStorage.getItem('language') || 'en';
      const t = (en, fr) => lang === 'fr' ? fr : en;

      navMenu.innerHTML = `
        <a href="index.html" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">${t('Home', 'Accueil')}</a>
        ${userService.isAdmin() ? `<a href="admin.html" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">${t('Admin', 'Admin')}</a>` : ''}
        ${userService.isChef(user.username) ? `<a href="chef.html" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">${t('Submit Recipe', 'Soumettre Recette')}</a>` : ''}
        ${userService.isTranslator(user.username) ? `<a href="translate.html" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">${t('Translate', 'Traduire')}</a>` : ''}
      `;
    };

    const applyLanguageToggle = () => {
      const currentLang = localStorage.getItem('language') || 'en';
      languageToggle.textContent = currentLang === 'en' ? 'FR' : 'EN';

      languageToggle.addEventListener('click', () => {
        const nextLang = currentLang === 'en' ? 'fr' : 'en';
        localStorage.setItem('language', nextLang);
        updateNav(); // Update navigation tabs to reflect the new language
        languageToggle.textContent = nextLang.toUpperCase();
      });
    };

    logoutButton.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('user'); // Clear user from localStorage
      window.location.href = 'login.html';
    });

    window.addEventListener('userStateChanged', updateNav);
    updateNav();
    applyLanguageToggle();
  }
};

export default Navigation;