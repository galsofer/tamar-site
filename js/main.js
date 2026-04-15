/* ===================================================
   main.js — הלוגיקה של האתר
   =================================================== */

/* ---------- אנימציית גלילה (Scroll Reveal) ----------

   IntersectionObserver הוא כלי JavaScript שמסתכל על
   כל האלמנטים עם הקלאס "reveal" ושואל:
   "האם הם נראים על המסך עכשיו?"

   כשתשובה = כן — הוא מוסיף את הקלאס "visible"
   הקלאס "visible" בCSS מפעיל את האנימציה (fadeUp).

   זו בדיוק הדרך שבה אתרים מקצועיים עושים את
   האנימציות "fade-in" בגלילה — ללא ספריות חיצוניות!
*/

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // אחרי שהאנימציה רצה, מפסיקים להסתכל (חסכון בביצועים)
                observer.unobserve(entry.target);
            }
        });
    },
    {
        threshold: 0.12,    // מתחיל כשמינימום 12% מהאלמנט נראה
        rootMargin: '0px 0px -40px 0px'  // מתחיל קצת לפני שנכנס לתצוגה
    }
);

// מחפש את כל האלמנטים עם הקלאס "reveal" ומצמיד להם את ה-observer
document.querySelectorAll('.reveal').forEach((el) => {
    observer.observe(el);
});


/* ---------- Staggered Grid — כניסת כרטיסים בסדרה ----------

   כל גריד עם קלאס "stagger-grid" מקבל ילדים שנכנסים
   אחד אחרי השני עם עיכוב גדל.

   איך זה עובד:
   1. אנחנו מוצאים כל גריד עם stagger-grid
   2. לכל ילד מגדירים --stagger-i = המספר שלו בתור (0,1,2...)
   3. CSS משתמש ב-calc() כדי להפוך את זה לעיכוב:
      --stagger-i * 110ms  →  0ms, 110ms, 220ms, 330ms...
   4. האנימציה עצמה זהה — רק העיכוב שונה לכל כרטיס

   הממ... קסם עם 4 שורות JS 🪄
*/
/* עוטפים ב-function כדי שנוכל להפעיל מחדש אחרי שה-content-loader מעדכן את ה-HTML */
function initStaggerGrids() {
    document.querySelectorAll('.stagger-grid').forEach((grid) => {
        grid.querySelectorAll('.reveal').forEach((card, index) => {
            card.style.setProperty('--stagger-i', index);
        });
    });
}
initStaggerGrids();


/* ---------- הדגשת קישור תפריט לפי מיקום הגלילה ----------

   זה עוקב אחרי הגלילה ומדגיש את הקישור הנכון בתפריט.
   לדוגמה: כשאתה בסקשן "שירותים", הקישור "שירותים" בתפריט
   יודגש אוטומטית.
*/

const sections    = document.querySelectorAll('section[id]');
const navLinks    = document.querySelectorAll('nav a');

const highlightNav = () => {
    const scrollY = window.scrollY;

    sections.forEach((section) => {
        const top    = section.offsetTop - 100;
        const bottom = top + section.offsetHeight;
        const id     = section.getAttribute('id');

        if (scrollY >= top && scrollY < bottom) {
            navLinks.forEach((link) => link.classList.remove('active'));
            const active = document.querySelector(`nav a[href="#${id}"]`);
            if (active) active.classList.add('active');
        }
    });
};

window.addEventListener('scroll', highlightNav, { passive: true });


/* ---------- פס התקדמות גלילה ----------
   עוקב כמה אחוז מהדף גללת ומעדכן את רוחב הפס.
   scrollY = כמה פיקסלים גללת מלמעלה
   scrollHeight - innerHeight = סך הפיקסלים שניתן לגלול
*/
const progressBar = document.getElementById('navProgress');

const updateProgress = () => {
    const scrolled  = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const pct       = maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0;
    progressBar.style.width = pct + '%';
};

window.addEventListener('scroll', updateProgress, { passive: true });




/* ---------- Change #2 — Animated Stat Counters ----------

   כל ספרה עם data-target מתחילה מ-0 וסופרת למעלה
   עד הערך שהגדרנו כשהיא נכנסת למסך.

   easeOut = מתחיל מהיר ומאט לקראת הסוף — טבעי יותר לעין.
   duration = כמה מילישניות נמשך הספירה (1400ms = 1.4 שניות)
*/
const counters = document.querySelectorAll('.stat-number[data-target]');

const runCounter = (el) => {
    const target   = parseFloat(el.dataset.target);
    const suffix   = el.dataset.suffix || '';   // % או + או כלום
    const duration = 1400;
    const start    = performance.now();

    const step = (now) => {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // easeOut cubic — מאט לקראת הסוף
        const eased    = 1 - Math.pow(1 - progress, 3);
        const current  = Math.round(eased * target);

        el.textContent = current + suffix;

        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;   // וודא ערך סופי מדויק
    };

    requestAnimationFrame(step);
};

const counterObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                runCounter(entry.target);
                counterObserver.unobserve(entry.target);  // רץ פעם אחת בלבד
            }
        });
    },
    { threshold: 0.5 }
);

counters.forEach((c) => counterObserver.observe(c));


/* ---------- Savings Tabs ----------
   כשלוחצים על אחד מה-5 כפתורים (01–05), אנחנו:
   1. מסירים .active מכל הכפתורים והפנלים
   2. מוסיפים .active רק לכפתור שנלחץ ולפנל המתאים
   3. ה-CSS מציג את הפנל הפעיל ומסתיר את השאר
*/
/* עוטפים ב-function כדי שנוכל להפעיל מחדש אחרי שה-content-loader בונה את הטאבים */
function initSavingsTabs() {
    const tabBtns   = document.querySelectorAll('.savings-tab-btn');
    const tabPanels = document.querySelectorAll('.savings-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.querySelector(`.savings-panel[data-panel="${target}"]`)
                    ?.classList.add('active');
        });
    });
}
initSavingsTabs();


/* ---------- Testimonials Carousel ----------
   גישה פשוטה ואמינה: display:none / display:block.
   אין חישובי רוחב, אין translateX — רק מוסיפים/מסירים
   את הקלאס "active" מה-slide הנכון.
   ה-CSS מטפל בfade-in עם keyframe animation.
*/
/* עוטפים ב-function כדי שנוכל להפעיל מחדש אחרי שה-content-loader בונה את הקרוסלה */
function initCarousel() {
    const track    = document.getElementById('testimonialsTrack');
    const dotsWrap = document.getElementById('carouselDots');
    const prevBtn  = document.querySelector('.carousel-prev');
    const nextBtn  = document.querySelector('.carousel-next');

    if (!track || !prevBtn || !nextBtn) return;

    const slides  = track.querySelectorAll('.carousel-slide');
    const allDots = dotsWrap ? dotsWrap.querySelectorAll('.carousel-dot') : [];
    const total   = slides.length;
    let current   = 0;
    let autoTimer = null;

    function goTo(idx) {
        if (idx < 0)       idx = total - 1;
        if (idx >= total)  idx = 0;
        slides[current].classList.remove('active');
        allDots[current]?.classList.remove('active');
        current = idx;
        slides[current].classList.add('active');
        allDots[current]?.classList.add('active');
    }

    function play()  { autoTimer = setInterval(() => goTo(current + 1), 5000); }
    function pause() { clearInterval(autoTimer); }

    /* מנקים אירועים ישנים לפני הוספת חדשים (למניעת כפילויות) */
    const newPrev = prevBtn.cloneNode(true);
    const newNext = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrev, prevBtn);
    nextBtn.parentNode.replaceChild(newNext, nextBtn);

    newPrev.addEventListener('click', () => { pause(); goTo(current - 1); play(); });
    newNext.addEventListener('click', () => { pause(); goTo(current + 1); play(); });

    /* מחדש נקודות */
    dotsWrap?.querySelectorAll('.carousel-dot').forEach((d, i) => {
        d.addEventListener('click', () => { pause(); goTo(i); play(); });
    });

    const vp = track.closest('.carousel-viewport');
    vp?.addEventListener('mouseenter', pause);
    vp?.addEventListener('mouseleave', play);

    /* swipe על מובייל */
    let touchX = 0;
    track.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend',   e => {
        const diff = touchX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) { pause(); goTo(diff > 0 ? current + 1 : current - 1); play(); }
    }, { passive: true });

    play();
}
initCarousel();


/* ---------- טיפול בטופס יצירת קשר ----------

   כרגע הטופס לא שולח אימייל אמיתי — זה ידרוש שרת.
   בינתיים, כשלוחצים על "שלח", מציגים הודעת הצלחה.
   בשלב מאוחר יותר נחבר את זה לשירות אמיתי.
*/

function handleSubmit(event) {
    event.preventDefault();   // מונע ריענון הדף (התנהגות ברירת מחדל של טופס)

    const button = event.target.querySelector('button');
    const originalText = button.textContent;

    // שינוי הכפתור למצב "שולח..."
    button.textContent = '...שולח';
    button.disabled = true;

    // סימולציה של שליחה (setTimeout = המתן X מילישניות)
    setTimeout(() => {
        button.textContent = '✓ הפנייה נשלחה בהצלחה!';
        button.style.backgroundColor = '#4caf50';
        event.target.reset();   // מנקה את שדות הטופס

        // חוזר לרגיל אחרי 4 שניות
        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = '';
            button.disabled = false;
        }, 4000);
    }, 1200);
}
