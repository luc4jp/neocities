document.addEventListener('DOMContentLoaded', () => {
    // テーマの初期適用
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
    }
    initSite();
});

async function initSite() {
    // 1. 共通パーツ（メニュー・フッター）の読み込み
    await loadComponents();

    // パーツ読み込み完了後にメニューのイベントを設定
    setupMenuAccordion();

    setupThemeToggle();
    initTooltips();
    setupSeamlessNavigation();
    fetchStatusCafe();
}

async function loadComponents() {
    const sidebarContainer = document.getElementById('sidebar-container');
    const footerContainer = document.getElementById('footer-container');

    try {
        // 左メニューの読み込み
        if (sidebarContainer && sidebarContainer.children.length === 0) {
            const res = await fetch('/menu.html', { cache: 'no-cache' });
            if (res.ok) sidebarContainer.innerHTML = await res.text();
        }
        // フッターの読み込み
        if (footerContainer && footerContainer.children.length === 0) {
            const res = await fetch('/footer.html', { cache: 'no-cache' });
            if (res.ok) footerContainer.innerHTML = await res.text();
        }
    } catch (e) {
        console.error('Components load error:', e);
    }
}

function fetchStatusCafe() {
    if (!document.getElementById('statuscafe')) return;

    const oldScript = document.getElementById('statuscafe-script');
    if (oldScript) oldScript.remove();

    const script = document.createElement('script');
    script.id = 'statuscafe-script';
    script.src = 'https://status.cafe/current-status.js?name=luc4';
    document.body.appendChild(script);
}

function setupThemeToggle() {
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        const updateButton = () => {
            const isDark = document.body.classList.contains('dark-theme');
            themeBtn.textContent = isDark ? 'Light Mode' : 'Dark Mode';
        };

        updateButton();

        themeBtn.onclick = (e) => {
            if (e) e.preventDefault();
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateButton();
        };
    }
}

// ページをフェッチして中身を入れ替える共通関数
async function fetchAndSwitchPage(url, pushState = true) {
    try {
        const targetUrlObj = new URL(url, window.location.href);
        const targetHash = targetUrlObj.hash;

        const response = await fetch(url, { cache: 'no-cache' });
        if (!response.ok) {
            window.location.href = url;
            return;
        }

        const responseUrlObj = new URL(response.url);
        let finalPath = responseUrlObj.pathname;

        if (finalPath.endsWith('/index.html')) {
            finalPath = finalPath.slice(0, -10);
        }

        const fullFinalPath = finalPath + targetHash;

        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        const newMain = doc.querySelector('.main-content');
        const currentMain = document.querySelector('.main-content');
        const container = document.querySelector('.container');

        if (!newMain || !currentMain || !container) {
            window.location.href = url;
            return;
        }

        if (doc.body) {
            const newBgImage = doc.body.style.backgroundImage;
            document.body.style.backgroundImage = newBgImage ? newBgImage : 'none';

            const isDark = localStorage.getItem('theme') === 'dark';
            document.body.className = doc.body.className;
            if (isDark) {
                document.body.classList.add('dark-theme');
            }
        }

        document.querySelectorAll('head style[data-dynamic-style]').forEach(el => el.remove());
        const newStyles = doc.querySelectorAll('style');
        newStyles.forEach(styleEl => {
            const clonedStyle = styleEl.cloneNode(true);
            clonedStyle.setAttribute('data-dynamic-style', 'true');
            document.head.appendChild(clonedStyle);
        });

        if (pushState) {
            history.pushState({ path: fullFinalPath }, '', fullFinalPath);
        }
        document.title = doc.title;

        currentMain.innerHTML = newMain.innerHTML;

        await executeScripts(currentMain);

        setupThemeToggle();
        initTooltips();
        fetchStatusCafe();

        if (targetHash) {
            const targetEl = document.querySelector(targetHash);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                window.scrollTo(0, 0);
            }
        } else {
            window.scrollTo(0, 0);
        }
    } catch (err) {
        console.error('Navigation error:', err);
        window.location.href = url;
    }
}

async function executeScripts(container) {
    const scripts = Array.from(container.querySelectorAll('script'));
    for (const oldScript of scripts) {
        const newScript = document.createElement('script');
        
        Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
        });

        if (oldScript.src) {
            await new Promise((resolve) => {
                newScript.onload = resolve;
                newScript.onerror = () => {
                    console.error(`Failed to load script: ${oldScript.src}`);
                    resolve();
                };
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });
        } else {
            newScript.textContent = oldScript.textContent;
            oldScript.parentNode.replaceChild(newScript, oldScript);
        }
    }
}

function setupSeamlessNavigation() {
    document.addEventListener('click', async (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        const rawHref = link.getAttribute('href');
        if (!rawHref || rawHref.startsWith('javascript:') || link.target === '_blank') {
            return;
        }

        if (rawHref.startsWith('#')) {
            e.preventDefault();
            if (rawHref === '#') return;
            
            const targetEl = document.querySelector(rawHref);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.pushState(null, '', rawHref);
            }
            return;
        }

        if (link.origin !== window.location.origin) {
            return;
        }

        if (link.href === window.location.href) {
            e.preventDefault();
            return;
        }

        e.preventDefault();
        await fetchAndSwitchPage(link.href, true);
    });

    window.addEventListener('popstate', async () => {
        await fetchAndSwitchPage(window.location.href, false);
    });
}

let tooltipInitialized = false;
function initTooltips() {
    let tooltip = document.getElementById('custom-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'custom-tooltip';
        tooltip.className = 'win-tooltip';
        document.body.appendChild(tooltip);
    }

    if (tooltipInitialized) return;
    tooltipInitialized = true;

    document.addEventListener('mouseover', (e) => {
        const btn = e.target.closest('.identity-btn');
        if (btn) {
            const titleText = btn.getAttribute('data-title');
            if (titleText) {
                tooltip.innerHTML = titleText.replace(/(\r\n|\n|\r|&#10;)/g, '<br>');
                tooltip.style.display = 'block';
            }
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (tooltip.style.display === 'block') {
            tooltip.style.left = (e.pageX + 15) + 'px';
            tooltip.style.top = (e.pageY + 15) + 'px';
        }
    });

    document.addEventListener('mouseout', (e) => {
        const btn = e.target.closest('.identity-btn');
        if (btn) {
            tooltip.style.display = 'none';
        }
    });
}

// メニューの折りたたみ処理（関数化）
function setupMenuAccordion() {
    const parentLinks = document.querySelectorAll('.menu-list > li');
    
    parentLinks.forEach(li => {
        const submenu = li.querySelector('.submenu-list');
        const link = li.querySelector('a');
        
        if (submenu && link) {
            li.classList.add('has-submenu');
            link.addEventListener('click', function(e) {
                if (window.innerWidth <= 800) {
                    e.preventDefault(); 
                    submenu.classList.toggle('is-open');
                }
            });
        }
    });
}