// Function to load external HTML components
async function loadComponent(id, file) {
    try {
        const response = await fetch(file);
        if (response.ok) {
            const html = await response.text();
            document.getElementById(id).innerHTML = html;
            return true;
        } else {
            console.error(`Failed to load ${file}: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error(`Error fetching ${file}:`, error);
        return false;
    }
}

// Initialize components and attach event listeners
async function initSite() {
    // Load components in parallel
    await Promise.all([
        loadComponent('sidebar-container', 'menu.html'),
        loadComponent('header-container', 'header.html'),
        loadComponent('footer-container', 'footer.html')
    ]);

    // Initialize Toggle Logic (must run AFTER menu.html is loaded)
    const themeBtn = document.getElementById('themeToggle');
    const fontBtn = document.getElementById('fontToggle');
    const textSizeBtn = document.getElementById('textSizeToggle');
    const body = document.body;

    if (themeBtn && fontBtn) {
        // Load saved preferences
        if (localStorage.getItem('theme') === 'dark') {
            body.classList.add('dark-theme');
            themeBtn.textContent = '☀️ Light';
        }
        if (localStorage.getItem('fontTheme') === 'alt') {
            body.classList.add('font-theme-alt');
            fontBtn.textContent = 'A Font: Pixel';
        }
        if (localStorage.getItem('textSize') === 'large') {
            body.classList.add('text-size-large');
            if (textSizeBtn) textSizeBtn.textContent = '🔍 Size: Large';
        }

        // Toggle Dark Mode
        themeBtn.addEventListener('click', () => {
            body.classList.toggle('dark-theme');
            if (body.classList.contains('dark-theme')) {
                localStorage.setItem('theme', 'dark');
                themeBtn.textContent = '☀️ Light';
            } else {
                localStorage.setItem('theme', 'light');
                themeBtn.textContent = '🌙 Dark';
            }
        });

        // Toggle Font Theme
        fontBtn.addEventListener('click', () => {
            body.classList.toggle('font-theme-alt');
            if (body.classList.contains('font-theme-alt')) {
                localStorage.setItem('fontTheme', 'alt');
                fontBtn.textContent = 'A Font: Pixel';
            } else {
                localStorage.setItem('fontTheme', 'main');
                fontBtn.textContent = 'A Font: Grotesk';
            }
        });

        // Toggle Text Size
        if (textSizeBtn) {
            textSizeBtn.addEventListener('click', () => {
                body.classList.toggle('text-size-large');
                if (body.classList.contains('text-size-large')) {
                    localStorage.setItem('textSize', 'large');
                    textSizeBtn.textContent = '🔍 Size: Large';
                } else {
                    localStorage.setItem('textSize', 'normal');
                    textSizeBtn.textContent = '🔍 Size: Normal';
                }
            });
        }
    }
}

// Run initialization on DOM content loaded
document.addEventListener('DOMContentLoaded', initSite);
