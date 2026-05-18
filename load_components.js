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

    initWidgets();

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

    // Initialize custom instant tooltips
    const buttons = document.querySelectorAll('.identity-btn');
    if (buttons.length > 0) {
        let tooltip = document.getElementById('custom-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'custom-tooltip';
            tooltip.className = 'win-tooltip';
            document.body.appendChild(tooltip);
        }

        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', (e) => {
                const titleText = btn.getAttribute('data-title');
                if (titleText) {
                    tooltip.innerHTML = titleText.replace(/\n/g, '<br>');
                    tooltip.style.display = 'block';
                }
            });

            btn.addEventListener('mousemove', (e) => {
                // Offset slightly from cursor so it doesn't flicker
                tooltip.style.left = (e.pageX + 15) + 'px';
                tooltip.style.top = (e.pageY + 15) + 'px';
            });

            btn.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        });
    }
}

// Run initialization on DOM content loaded
document.addEventListener('DOMContentLoaded', initSite);

// Initialize Sidebar Widgets (Clock, Weather, Calendar)
function initWidgets() {
    // 1. Clocks
    const localClock = document.getElementById('local-clock');
    const japanClock = document.getElementById('japan-clock');
    
    function updateClocks() {
        if (!localClock || !japanClock) return;
        const now = new Date();
        
        // Local Time
        localClock.textContent = now.toLocaleTimeString();
        
        // Japan Time
        const jstOptions = { timeZone: 'Asia/Tokyo', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
        japanClock.textContent = now.toLocaleTimeString('en-US', jstOptions);
    }
    
    if (localClock || japanClock) {
        updateClocks();
        setInterval(updateClocks, 1000);
    }

    // 2. Weather (Hiroshima)
    const weatherWidget = document.getElementById('weather-widget');
    if (weatherWidget) {
        // Open-Meteo API for Hiroshima
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
                    <div style="font-size: 24px; margin-bottom: 5px;">${cw.temperature}°C</div>
                    <div style="font-weight: bold; color: var(--win-title-blue);">${condition}</div>
                `;
            })
            .catch(err => {
                weatherWidget.textContent = "Weather unavailable";
            });
    }

    // 3. Calendar (Current Month)
    const calendarWidget = document.getElementById('calendar-widget');
    if (calendarWidget) {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        
        let calHtml = `<div style="font-weight: bold; margin-bottom: 5px; background: var(--win-title-blue); color: #fff;">${year} / ${month + 1}</div>`;
        calHtml += `<table style="width: 100%; text-align: center; border-collapse: collapse; font-size: 10px;">`;
        calHtml += `<tr style="background: var(--win-face);"><th style="color:red;">S</th><th>M</th><th>T</th><th>W</th><th>T</th><th>F</th><th style="color:blue;">S</th></tr><tr>`;
        
        for (let i = 0; i < firstDay; i++) {
            calHtml += `<td></td>`;
        }
        
        let dayOfWeek = firstDay;
        for (let day = 1; day <= daysInMonth; day++) {
            let style = "";
            if (dayOfWeek === 0) style = "color: red;";
            if (dayOfWeek === 6) style = "color: blue;";
            if (day === today.getDate()) style += " background-color: var(--win-title-blue); color: #fff; font-weight: bold;";
            
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

