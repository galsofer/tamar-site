/* ===================================================
   content-loader.js — טעינת תוכן דינמי מ-content.json
   ===================================================

   איך זה עובד בגדול:
   1. הדפדפן טוען את ה-HTML עם הטקסט הקשיח (fallback)
   2. הסקריפט הזה מבקש את הקובץ content.json מהשרת
   3. כשהקובץ מגיע — מעדכנים את כל הטקסטים והכרטיסים באתר
   4. המשתמש רואה את התוכן העדכני מבלי לשים לב

   למה זה חשוב?
   כי תמר תערוך את content.json דרך לוח הניהול,
   ואנחנו צריכים שהשינויים יופיעו באתר אוטומטית.
   ================================================== */


/* ---------- הפונקציה הראשית ---------- */
(async function loadSiteContent() {
    try {
        /* fetch = "תביא לי קובץ מהאינטרנט"
           כאן אנחנו מבקשים את קובץ התוכן מאותו שרת */
        const response = await fetch('/content.json');

        /* אם הבקשה נכשלה (שגיאת 404 וכו') — עוצרים */
        if (!response.ok) return;

        /* הופכים את תוכן הקובץ ל-JavaScript object שנוכל לעבוד איתו */
        const content = await response.json();

        /* מפעילים את כל הפונקציות שמעדכנות את האתר */
        applyDesign(content.design);
        applyHero(content.hero);
        applyPainPoints(content.pain_points);
        applyAbout(content.about);
        applyServices(content.services);
        applySavings(content.savings);
        applyTestimonials(content.testimonials);
        applyContact(content.contact);

        /* אחרי שבנינו את כל ה-HTML מחדש —
           מאתחלים מחדש את רכיבי הדף (טאבים, קרוסלה וכו') */
        if (typeof initStaggerGrids === 'function')  initStaggerGrids();
        if (typeof initSavingsTabs  === 'function')  initSavingsTabs();
        if (typeof initCarousel     === 'function')  initCarousel();

        /* מאתחלים את אנימציות הגלילה לאלמנטים החדשים */
        document.querySelectorAll('.reveal').forEach(el => {
            if (typeof observer !== 'undefined') observer.observe(el);
        });

    } catch (error) {
        /* אם משהו נכשל (אין רשת, קובץ פגום וכו') —
           האתר ימשיך לעבוד עם הטקסט הקשיח שב-HTML */
        console.log('content-loader: using default HTML content');
    }
})();


/* ===================================================
   פונקציות עזר
   =================================================== */

/* set — מעדכן טקסט רגיל של אלמנט לפי CSS selector */
function set(selector, text) {
    const el = document.querySelector(selector);
    if (el && text !== undefined) el.textContent = text;
}

/* setHTML — מעדכן HTML פנימי (כולל תגיות כמו <strong>) */
function setHTML(selector, html) {
    const el = document.querySelector(selector);
    if (el && html !== undefined) el.innerHTML = html;
}


/* ===================================================
   פונקציות לכל סקשן
   =================================================== */

/* ----- עיצוב: גופן, גודל, צבעים ----- */
function applyDesign(design) {
    if (!design) return;

    /* --- גופן ---
       CSS variables הם כמו "מתגים מרכזיים" ב-CSS.
       כשמשנים את הערך ב-:root, זה משפיע על כל האתר בבת אחת. */
    if (design.font) {
        /* טוענים את הגופן מ-Google Fonts אם הוא לא Assistant (שכבר נטען ב-HTML) */
        if (design.font !== 'Assistant') {
            const fontUrl = `https://fonts.googleapis.com/css2?family=${design.font.replace(/ /g, '+')}:wght@300;400;500;600;700;800&display=swap`;
            const link = document.createElement('link');
            link.rel  = 'stylesheet';
            link.href = fontUrl;
            document.head.appendChild(link);
        }
        /* מגדירים את הגופן על כל האתר */
        document.body.style.fontFamily = `'${design.font}', 'Segoe UI', Arial, sans-serif`;
    }

    /* --- גודל טקסט ---
       font-size על ה-body קובע את הגודל הבסיסי שממנו כל שאר הגדלים יחסיים */
    if (design.text_size) {
        const sizes = { small: '14px', medium: '16px', large: '18px' };
        document.body.style.fontSize = sizes[design.text_size] || '16px';
    }

    /* --- צבעים ---
       style.setProperty משנה CSS variable — כמו לשנות ערך במשתנה גלובלי.
       כל המקומות באתר שמשתמשים ב-var(--warm-brown) יקבלו את הצבע החדש מיד. */
    if (design.primary_color) {
        document.documentElement.style.setProperty('--warm-brown', design.primary_color);
        /* גם גרסה כהה יותר לאפקט hover — מחשבים אוטומטית */
        document.documentElement.style.setProperty('--warm-brown-dk', darken(design.primary_color, 15));
    }

    if (design.text_color) {
        document.documentElement.style.setProperty('--text-dark', design.text_color);
    }
}

/* פונקציית עזר: מכהה צבע HEX בכמות נתונה של אחוזים
   לדוגמה: darken("#8b6f4e", 15) → גרסה כהה ב-15% */
function darken(hex, amount) {
    /* הופכים HEX לערכי RGB */
    const num = parseInt(hex.replace('#', ''), 16);
    const r   = Math.max(0, (num >> 16) - Math.round(2.55 * amount));
    const g   = Math.max(0, ((num >> 8) & 0xff) - Math.round(2.55 * amount));
    const b   = Math.max(0, (num & 0xff) - Math.round(2.55 * amount));
    /* חוזרים ל-HEX */
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}


/* ----- Hero ----- */
function applyHero(hero) {
    if (!hero) return;
    set('.hero-eyebrow',   hero.eyebrow);
    setHTML('.hero h1',    hero.title);
    set('.hero-sub',       hero.subtitle);
    set('.hero .cta-button', hero.cta_text);
}


/* ----- Pain Points (למי מתאים?) ----- */
function applyPainPoints(data) {
    if (!data) return;
    set('#pain-points .section-title', data.title);
    set('#pain-points .section-sub',   data.subtitle);

    /* בונים את כל הכרטיסים מחדש מהרשימה שב-JSON */
    const grid = document.querySelector('.pain-grid');
    if (grid && data.items) {
        grid.innerHTML = data.items.map((item, i) => `
            <div class="pain-card reveal" style="--stagger-i: ${i}">
                <span class="pain-icon">${item.icon}</span>
                <div>
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                </div>
            </div>
        `).join('');
    }
}


/* ----- אודות ----- */
function applyAbout(data) {
    if (!data) return;
    set('#about .section-title', data.title);

    /* מעדכנים את 4 הפסקאות */
    const paragraphs = document.querySelectorAll('.about-text p.reveal');
    const texts = [data.p1, data.p2, data.p3, data.p4];
    paragraphs.forEach((p, i) => {
        if (texts[i] !== undefined) p.innerHTML = texts[i];
    });

    /* מעדכנים את מספרי הסטטיסטיקה */
    if (data.stats) {
        const statNumbers = document.querySelectorAll('.stat-number[data-target]');
        const values = [
            data.stats.experience_years,
            data.stats.independent_years,
            data.stats.commitment
        ];
        statNumbers.forEach((el, i) => {
            if (values[i] !== undefined) {
                el.dataset.target = values[i];
            }
        });
    }
}


/* ----- שירותים ----- */
function applyServices(data) {
    if (!data) return;
    set('#services .section-title', data.title);
    set('#services .section-sub',   data.subtitle);

    const grid = document.querySelector('.services-grid');
    if (grid && data.items) {
        grid.innerHTML = data.items.map((item, i) => `
            <div class="service-card reveal" style="--stagger-i: ${i}">
                <span class="service-icon">${item.icon}</span>
                <h3>${item.title}</h3>
                <p>${item.description}</p>
            </div>
        `).join('');
    }
}


/* ----- חסכון / יתרונות (Tabs) ----- */
function applySavings(data) {
    if (!data) return;
    set('#savings .section-title', data.title);
    set('#savings .section-sub',   data.subtitle);

    if (!data.items) return;

    /* בונים את כפתורי הטאב */
    const tabNav = document.querySelector('.savings-tab-nav');
    if (tabNav) {
        tabNav.innerHTML = data.items.map((_, i) => `
            <button class="savings-tab-btn${i === 0 ? ' active' : ''}" data-tab="${i}">
                ${i + 1}
            </button>
        `).join('');
    }

    /* בונים את פנלי הטאב */
    const panelWrap = document.querySelector('.savings-panel-wrap');
    if (panelWrap) {
        panelWrap.innerHTML = data.items.map((item, i) => `
            <div class="savings-panel${i === 0 ? ' active' : ''}" data-panel="${i}">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
            </div>
        `).join('');
    }
}


/* ----- המלצות (Carousel) ----- */
function applyTestimonials(data) {
    if (!data) return;
    set('#testimonials .section-title', data.title);
    set('#testimonials .section-sub',   data.subtitle);

    if (!data.items) return;

    /* בונים את השקפים (slides) */
    const track = document.getElementById('testimonialsTrack');
    if (track) {
        track.innerHTML = data.items.map((item, i) => `
            <div class="carousel-slide${i === 0 ? ' active' : ''}">
                <div class="carousel-card">
                    <span class="carousel-quote-mark">"</span>
                    <p class="carousel-text">${item.text}</p>
                    <div class="carousel-author">
                        <div class="carousel-avatar">${item.avatar_letter}</div>
                        <div>
                            <span class="carousel-author-name">${item.author_name}</span>
                            <span class="carousel-author-role">${item.author_role}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /* בונים את הנקודות בתחתית הקרוסלה */
    const dotsWrap = document.getElementById('carouselDots');
    if (dotsWrap) {
        dotsWrap.innerHTML = data.items.map((_, i) => `
            <button class="carousel-dot${i === 0 ? ' active' : ''}" data-slide="${i}"></button>
        `).join('');
    }
}


/* ----- יצירת קשר ----- */
function applyContact(data) {
    if (!data) return;
    set('#contact .section-title', data.title);
    set('#contact .section-sub',   data.subtitle);

    /* מעדכנים את פרטי הקשר */
    const contactItems = document.querySelectorAll('.contact-info-item');
    contactItems.forEach(item => {
        const icon = item.querySelector('.icon');
        if (!icon) return;

        /* מזהים לפי האמוג'י איזה שדה זה */
        if (icon.textContent.trim() === '📞' && data.phone) {
            const textNode = item.querySelector('span:not(.icon)');
            if (textNode) textNode.textContent = data.phone;
        }
        if (icon.textContent.trim() === '✉️' && data.email) {
            const textNode = item.querySelector('span:not(.icon)');
            if (textNode) textNode.textContent = data.email;
        }
    });

    /* מעדכנים גם את הפוטר */
    const footer = document.querySelector('footer p');
    if (footer && data.phone && data.email) {
        footer.innerHTML = `© 2026 תמר סופר — ניהול משרד לעסקים · <a href="mailto:${data.email}" style="color:inherit;opacity:0.7;">${data.email}</a> · ${data.phone}`;
    }

    /* מעדכנים את לינק ה-WhatsApp */
    const whatsapp = document.querySelector('.whatsapp-float');
    if (whatsapp && data.phone) {
        const digits = data.phone.replace(/\D/g, '');
        /* ממיר 054-432-4776 ל-972544324776 (פורמט בינלאומי) */
        const intl = '972' + digits.replace(/^0/, '');
        whatsapp.href = `https://wa.me/${intl}`;
    }
}
