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
        <div class="md:hidden">
          <button id="nav-toggle" class="bg-blue-600 text-white px-4 py-2 rounded">Menu</button>
          <div id="nav-links" class="hidden flex flex-col space-y-2 mt-2">
            <a href="index.html" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">${t('Home', 'Accueil')}</a>
            ${userService.isAdmin() ? `<a href="admin.html" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">${t('Admin', 'Admin')}</a>` : ''}
            ${userService.isChef() ? `<a href="chef.html" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">${t('Submit Recipe', 'Soumettre Recette')}</a>` : ''}
            ${userService.isTranslator() ? `<a href="translate.html" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">${t('Translate', 'Traduire')}</a>` : ''}
          </div>
        </div>
        <div class="hidden md:flex flex-row space-x-4">
          <a href="index.html" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">${t('Home', 'Accueil')}</a>
          ${userService.isAdmin() ? `<a href="admin.html" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">${t('Admin', 'Admin')}</a>` : ''}
          ${userService.isChef() ? `<a href="chef.html" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">${t('Submit Recipe', 'Soumettre Recette')}</a>` : ''}
          ${userService.isTranslator() ? `<a href="translate.html" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">${t('Translate', 'Traduire')}</a>` : ''}
        </div>
      `;

      const navToggle = document.getElementById('nav-toggle');
      const navLinks = document.getElementById('nav-links');

      navToggle?.addEventListener('click', () => {
        navLinks.classList.toggle('hidden');
      });

      highlightCurrentPage();
    };

    const highlightCurrentPage = () => {
      const currentPath = window.location.pathname.split('/').pop();
      const navLinks = navMenu.querySelectorAll('a');

      console.log('Navigation: Current Path:', currentPath); // Debugging log
      console.log('Navigation: Navigation Links:', navLinks); // Debugging log

      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        console.log('Navigation: Checking link:', href); // Debugging log
        if (href && currentPath && href.split('?')[0] === currentPath.split('?')[0]) {
          link.classList.add('bg-blue-900', 'text-white'); // Highlight class
          console.log('Navigation: Highlighting link:', href); // Debugging log
        } else {
          link.classList.remove('bg-blue-900', 'text-white');
        }
      });
    };

    window.addEventListener('load', () => {
      console.log('Highlighting current page on load'); // Debugging log
      highlightCurrentPage();
    });

    const applyLanguageToggle = () => {
      const currentLang = localStorage.getItem('language') || 'en';
      languageToggle.textContent = currentLang === 'en' ? 'FR' : 'EN';

      languageToggle.addEventListener('click', () => {
        const nextLang = currentLang === 'en' ? 'fr' : 'en';
        localStorage.setItem('language', nextLang);
        location.reload();
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