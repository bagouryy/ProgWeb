import userService from './userService.js';

const Navigation = {
  init: (navMenuId, userInfoId, logoutButtonId, languageToggleId) => {
    const navMenu = document.getElementById(navMenuId);
    const userInfo = document.getElementById(userInfoId);
    const logoutButton = document.getElementById(logoutButtonId);
    const languageToggle = document.getElementById(languageToggleId);
    const mobileNav = document.getElementById('mobile-nav');
    const navToggle = document.getElementById('nav-toggle');

    const updateNav = async () => {
      const user = userService.getLoggedInUser();
      if (!user) return (window.location.href = 'login.html');

      userInfo.textContent = user.username;
      const lang = localStorage.getItem('language') || 'en';
      const t = (en, fr) => lang === 'fr' ? fr : en;

      const linkClass = "text-gray-300 hover:bg-blue-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium";

        const links = `
        <a href="index.html" class="${linkClass}">${t('Home', 'Accueil')}</a>
        ${userService.isAdmin() ? `<a href="admin.html" class="${linkClass}">${t('Admin', 'Admin')}</a>` : ''}
        ${userService.isChef() ? `<a href="chef.html" class="${linkClass}">${t('Submit Recipe', 'Soumettre Recette')}</a>` : ''}
        ${userService.isTranslator() ? `<a href="translate.html" class="${linkClass}">${t('Translate', 'Traduire')}</a>` : ''}
        `;

      navMenu.innerHTML = links;
      document.getElementById('mobile-nav').innerHTML = `
        ${links}
        <button id="mobile-logout" class="text-left hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium mt-2">
            Logout
        </button>
        `;

        const mobileLogoutButton = document.getElementById('mobile-logout');
        mobileLogoutButton?.addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        });

      highlightCurrentPage();
    };

    const highlightCurrentPage = () => {
      const currentPath = window.location.pathname.split('/').pop();
      const allLinks = document.querySelectorAll('#nav-menu a, #mobile-nav a');

      allLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath && href.split('?')[0] === currentPath.split('?')[0]) {
          link.classList.add('bg-blue-900', 'text-white');
        } else {
          link.classList.remove('bg-blue-900', 'text-white');
        }
      });
    };

    const applyLanguageToggle = () => {
      const currentLang = localStorage.getItem('language') || 'en';
      languageToggle.textContent = currentLang === 'en' ? 'FR' : 'EN';

      languageToggle.addEventListener('click', () => {
        const nextLang = currentLang === 'en' ? 'fr' : 'en';
        localStorage.setItem('language', nextLang);
        location.reload();
      });
    };

    // ✅ Attach toggle event ONCE
    navToggle?.addEventListener('click', () => {
      mobileNav.classList.toggle('hidden');
    });

    logoutButton.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    });

    window.addEventListener('userStateChanged', updateNav);
    updateNav();
    applyLanguageToggle();
  }
};

export default Navigation;
