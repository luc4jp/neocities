// 1. External HTML Component Loader
async function loadComponent(id, file) {
    try {
        const response = await fetch(file);
        if (response.ok) {
            const html = await response.text();
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = html;
            }
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

// 2. Prevent theme flash on DOM load
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
    }
});

// 3. Main Site Initializer
async function initSite() {
    // 非同期でパーツ（左メニュー含む）をすべて読み込み完了するまで待つ
    await Promise.all([
        loadComponent('sidebar-container', 'menu.html'),
        loadComponent('header-container', 'header.html'),
        loadComponent('footer-container', 'footer.html')
    ]);

    // テーマ状態の適用
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
    }

    // ウィジェット初期化（時計・天気・カレンダー）
    try {
        initWidgets();
    } catch (e) {
        console.error('Widget initialization error:', e);
    }

    // テーマ切り替えボタンの設定
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.textContent = document.body.classList.contains('dark-theme') ? 'Light Mode' : 'Dark Mode';

        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            themeBtn.textContent = isDark ? 'Light Mode' : 'Dark Mode';
        });
    }

    // メニューやページ描画完了後にツールチップ（補足表示）を初期化
    initTooltips();
}

// Custom Tooltip Setup
function initTooltips() {
    const buttons = document.querySelectorAll('.identity-btn');
    if (buttons.length === 0) return;

    let tooltip = document.getElementById('custom-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'custom-tooltip';
        tooltip.className = 'win-tooltip';
        document.body.appendChild(tooltip);
    }

    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            const titleText = btn.getAttribute('data-title');
            if (titleText) {
                // 改行（\n や &#10;）を <br> に変換して表示
                tooltip.innerHTML = titleText.replace(/(\r\n|\n|\r|&#10;)/g, '<br>');
                tooltip.style.display = 'block';
            }
        });

        btn.addEventListener('mousemove', (e) => {
            tooltip.style.left = (e.pageX + 15) + 'px';
            tooltip.style.top = (e.pageY + 15) + 'px';
        });

        btn.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
    });
}

// 5. Sidebar Widgets (Clock, Weather, Calendar)
function initWidgets() {
    // Clocks
    const localClock = document.getElementById('local-clock');
    const japanClock = document.getElementById('japan-clock');

    function updateClocks() {
        if (!localClock || !japanClock) return;
        const now = new Date();

        localClock.textContent = now.toLocaleTimeString();

        const jstOptions = { timeZone: 'Asia/Tokyo', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
        japanClock.textContent = now.toLocaleTimeString('en-US', jstOptions);
    }

    if (localClock || japanClock) {
        updateClocks();
        setInterval(updateClocks, 1000);
    }

    // Weather (Hiroshima)
    const weatherWidget = document.getElementById('weather-widget');
    if (weatherWidget) {
        fetch('https://api.open-meteo.com/v1/forecast?latitude=34.3853&longitude=132.4553&current_weather=true&timezone=Asia%2FTokyo')
            .then(res => res.json())
            .then(data => {
                const cw = data.current_weather;
                let condition = "Clear";
                if (cw.weathercode >= 1 && cw.weathercode <= 3) condition = "Cloudy";
                if (cw.weathercode >= 45 && cw.weathercode <= 48) condition = "Fog";
                if (cw.weathercode >= 51 && cw.weathercode <= 67) condition = "Rain";
                if (cw.weathercode >= 71 && cw.weathercode <= 82) condition = "Snow";
                if (cw.weathercode >= 95) condition = "Thunderstorm";

                weatherWidget.innerHTML = `
                    <div style="font-size: 22px; font-weight: bold; font-family: var(--font-heading); color: var(--lilac-dark); margin-bottom: 2px;">${cw.temperature}°C</div>
                    <div style="font-weight: bold; color: var(--lilac-main); font-size: 13px;">${condition}</div>
                `;
            })
            .catch(() => {
                weatherWidget.textContent = "Weather unavailable";
            });
    }

    // Calendar
    const calendarWidget = document.getElementById('calendar-widget');
    if (calendarWidget) {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();

        let calHtml = `<div style="font-weight: bold; font-family: var(--font-heading); margin-bottom: 6px; background: var(--lilac-sub-bg); color: var(--lilac-dark); border-bottom: 1.5px solid var(--lilac-border); border-radius: 0; padding: 2px 0; font-size: 13px;">${year} / ${month + 1}</div>`;
        calHtml += `<table style="width: 100%; text-align: center; border-collapse: collapse; font-size: 11px; font-family: var(--font-body);">`;
        calHtml += `<tr style="color: var(--text-muted); font-size: 10px;"><th style="color:#ff5f8d;">S</th><th>M</th><th>T</th><th>W</th><th>T</th><th>F</th><th style="color:#70d6ff;">S</th></tr><tr>`;

        for (let i = 0; i < firstDay; i++) {
            calHtml += `<td></td>`;
        }

        let dayOfWeek = firstDay;
        for (let day = 1; day <= daysInMonth; day++) {
            let style = "padding: 2px;";
            if (dayOfWeek === 0) style += " color: #ff5f8d;";
            if (dayOfWeek === 6) style += " color: #70d6ff;";
            if (day === today.getDate()) style += " background-color: var(--lilac-border); color: var(--lilac-dark); font-weight: bold; border-radius: 0;";

            calHtml += `<td style="${style}">${day}</td>`;
            dayOfWeek++;
            if (dayOfWeek > 6) {
                calHtml += `</tr><tr>`;
                dayOfWeek = 0;
            }
        }
        calHtml += `</tr></table>`;
        calendarWidget.innerHTML = calHtml;
    }
}

// 6. Global Execution Point
document.addEventListener('DOMContentLoaded', initSite);
