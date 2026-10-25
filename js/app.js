/**
 * Haven Cafe - Main Application
 * Alpine.js components (menu book, gallery, reservation, etc.)
 * Version: 2.0.0
 * Author: Nokensoft
 */

// ==========================================================================
// Tailwind Configuration
// ==========================================================================
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#1a4d2e',
                dark: '#111827',
                darkLighter: '#1f2937'
            },
            fontFamily: {
                sans: ['Plus Jakarta Sans', 'sans-serif'],
            },
        }
    }
};

// ==========================================================================
// Business Constants
// ==========================================================================
const WHATSAPP_NUMBER = '6281248584145';

// Open Wednesday - Monday, 11:00 - 21:00 WIT (UTC+9). Closed every Tuesday.
const OPENING_HOURS = { open: 11, close: 21, closedDay: 2, utcOffset: 9 };

// ==========================================================================
// Utility Functions
// ==========================================================================

/**
 * Generate WhatsApp URL with an encoded message
 * @param {string} message - Message to send
 * @returns {string} WhatsApp URL
 */
function waUrl(message = '') {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Normalize text for loose search: lowercase, letters and digits only.
 * Handles letter-spaced text from the menu PDF ("V a n i l l a").
 * @param {string} text
 * @returns {string}
 */
function normalizeSearch(text) {
    return text.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
}

/**
 * Current open/closed status in Sentani local time (WIT)
 * @returns {{open: boolean, label: string}}
 */
function openStatus() {
    const now = new Date(Date.now() + OPENING_HOURS.utcOffset * 3600000);
    const day = now.getUTCDay();
    const hour = now.getUTCHours() + now.getUTCMinutes() / 60;
    if (day === OPENING_HOURS.closedDay) return { open: false, label: 'Closed today (Tuesday)' };
    if (hour < OPENING_HOURS.open) return { open: false, label: 'Opens today at 11:00' };
    if (hour >= OPENING_HOURS.close) {
        return { open: false, label: day === OPENING_HOURS.closedDay - 1 ? 'Closed · Opens Wednesday 11:00' : 'Closed · Opens tomorrow 11:00' };
    }
    return { open: true, label: 'Open now · until 21:00' };
}

const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=-2.5833&longitude=140.4851'
    + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day'
    + '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max'
    + '&timezone=Asia%2FJayapura&forecast_days=1';

/**
 * Map a WMO weather code to a label and Font Awesome icon
 * @param {number} code - WMO weather code
 * @param {boolean} isDay
 * @returns {{label: string, icon: string, color: string}}
 */
function weatherCondition(code, isDay) {
    if (code === 0) return isDay
        ? { label: 'Clear & sunny', icon: 'fa-sun', color: 'text-amber-400' }
        : { label: 'Clear night', icon: 'fa-moon', color: 'text-indigo-300' };
    if (code <= 2) return isDay
        ? { label: code === 1 ? 'Mostly sunny' : 'Partly cloudy', icon: 'fa-cloud-sun', color: 'text-amber-400' }
        : { label: code === 1 ? 'Mostly clear' : 'Partly cloudy', icon: 'fa-cloud-moon', color: 'text-indigo-300' };
    if (code === 3) return { label: 'Overcast', icon: 'fa-cloud', color: 'text-gray-400' };
    if (code <= 48) return { label: 'Foggy', icon: 'fa-smog', color: 'text-gray-400' };
    if (code <= 57) return { label: 'Light drizzle', icon: 'fa-cloud-rain', color: 'text-sky-500' };
    if (code <= 67) return { label: code >= 65 ? 'Heavy rain' : 'Rain', icon: 'fa-cloud-showers-heavy', color: 'text-sky-500' };
    if (code <= 77) return { label: 'Snow', icon: 'fa-snowflake', color: 'text-sky-300' };
    if (code <= 82) return { label: 'Rain showers', icon: 'fa-cloud-showers-heavy', color: 'text-sky-500' };
    return { label: 'Thunderstorm', icon: 'fa-cloud-bolt', color: 'text-violet-500' };
}

/**
 * A short, friendly suggestion based on today's weather
 */
function weatherTip(code, rainChance, temp) {
    if (code >= 95) return 'Stormy out there — stay cozy indoors with a hot latte.';
    if (code >= 51 || rainChance >= 70) return 'Rain is likely today — perfect weather for a hot coffee indoors.';
    if (temp >= 30) return 'It\'s hot today — cool down with an iced coffee or a fresh squash.';
    return 'Great weather to relax in our orchid garden.';
}

/**
 * Lock or unlock page scroll while an overlay is open
 * @param {boolean} locked
 */
function lockScroll(locked) {
    document.documentElement.classList.toggle('overflow-hidden', locked);
}

/**
 * Overlay mixin: scroll lock + browser "back" closes the overlay (important on mobile).
 * Components using it must implement onOverlayClose().
 */
function overlayMixin() {
    return {
        _popHandler: null,

        overlayOpened() {
            lockScroll(true);
            history.pushState({ havenOverlay: true }, '');
            this._popHandler = () => {
                this._popHandler = null;
                this.onOverlayClose();
            };
            window.addEventListener('popstate', this._popHandler, { once: true });
        },

        overlayClosed() {
            lockScroll(false);
            if (this._popHandler) {
                window.removeEventListener('popstate', this._popHandler);
                this._popHandler = null;
                if (history.state && history.state.havenOverlay) history.back();
            }
        }
    };
}

/**
 * Swipe mixin: horizontal swipe calls next()/prev() unless swipeDisabled is true.
 */
function swipeMixin() {
    return {
        _touch: null,
        swipeDisabled: false,

        touchStart(e) {
            if (e.touches.length !== 1) { this._touch = null; return; }
            this._touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        },

        touchEnd(e) {
            if (!this._touch || this.swipeDisabled) return;
            const dx = e.changedTouches[0].clientX - this._touch.x;
            const dy = e.changedTouches[0].clientY - this._touch.y;
            this._touch = null;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                dx < 0 ? this.next() : this.prev();
            }
        }
    };
}

// ==========================================================================
// Alpine.js Components
// ==========================================================================
document.addEventListener('alpine:init', () => {

    /**
     * Root app state: theme, navigation, scrollspy
     */
    Alpine.data('app', () => ({
        darkMode: document.documentElement.classList.contains('dark'),
        currentSection: 'home',
        drawerOpen: false,
        scrolled: false,
        status: openStatus(),
        links: [
            { id: 'home', label: 'Home', short: 'Home', icon: 'fa-house' },
            { id: 'menu', label: 'Menu', short: 'Menu', icon: 'fa-book-open' },
            { id: 'takeaway', label: 'Delivery', short: 'Order', icon: 'fa-motorcycle' },
            { id: 'events', label: 'Events', short: 'Events', icon: 'fa-seedling' },
            { id: 'reservation', label: 'Reservation', short: 'Book', icon: 'fa-calendar-check' },
            { id: 'gallery', label: 'Gallery', short: 'Gallery', icon: 'fa-images' }
        ],
        mobileLinks: ['home', 'menu', 'takeaway', 'reservation', 'gallery'],

        init() {
            this.$watch('darkMode', value => {
                document.documentElement.classList.toggle('dark', value);
                try { localStorage.setItem('theme', value ? 'dark' : 'light'); } catch (e) { /* storage unavailable */ }
            });
            this.$watch('drawerOpen', value => lockScroll(value));

            const onScroll = () => { this.scrolled = window.scrollY > 40; };
            window.addEventListener('scroll', onScroll, { passive: true });
            onScroll();

            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) this.currentSection = entry.target.id;
                });
            }, { rootMargin: '-45% 0px -50% 0px' });
            document.querySelectorAll('[data-spy]').forEach(el => observer.observe(el));

            setInterval(() => { this.status = openStatus(); }, 60000);
        },

        toggleTheme() {
            this.darkMode = !this.darkMode;
        },

        isActive(section) {
            return this.currentSection === section;
        }
    }));

    /**
     * Hero image slider with autoplay and swipe
     */
    Alpine.data('heroSlider', () => ({
        ...swipeMixin(),
        active: 0,
        slides: [
            { src: 'images/hero/hero-1.webp', alt: 'Coffee flight on the Haven Cafe bar' },
            { src: 'images/hero/hero-2.webp', alt: 'Orchid garden seating at Haven Cafe' },
            { src: 'images/hero/hero-3.webp', alt: 'Haven Cafe garden terrace at night' },
            { src: 'images/hero/hero-4.webp', alt: 'Evening gathering in the Haven Cafe garden' }
        ],
        timer: null,

        init() {
            this.play();
            document.addEventListener('visibilitychange', () => document.hidden ? this.pause() : this.play());
        },

        play() {
            this.pause();
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            this.timer = setInterval(() => this.next(), 5000);
        },

        pause() {
            clearInterval(this.timer);
        },

        go(index) {
            this.active = (index + this.slides.length) % this.slides.length;
            this.play();
        },

        next() { this.go(this.active + 1); },
        prev() { this.go(this.active - 1); }
    }));

    /**
     * Live weather for Sentani from Open-Meteo (free, no API key)
     */
    Alpine.data('weather', () => ({
        data: null,
        loading: true,
        error: false,

        init() {
            this.load();
            setInterval(() => this.load(), 15 * 60000);
        },

        async load() {
            this.error = false;
            try {
                const res = await fetch(WEATHER_URL);
                if (!res.ok) throw new Error(res.statusText);
                const json = await res.json();
                const c = json.current;
                const d = json.daily;
                const condition = weatherCondition(c.weather_code, c.is_day === 1);
                const rain = d.precipitation_probability_max[0] ?? 0;
                this.data = {
                    ...condition,
                    temp: Math.round(c.temperature_2m),
                    feels: Math.round(c.apparent_temperature),
                    humidity: c.relative_humidity_2m,
                    max: Math.round(d.temperature_2m_max[0]),
                    min: Math.round(d.temperature_2m_min[0]),
                    rain,
                    time: c.time.slice(11, 16),
                    tip: weatherTip(c.weather_code, rain, c.temperature_2m)
                };
            } catch (e) {
                console.error('Failed to load weather', e);
                if (!this.data) this.error = true;
            }
            this.loading = false;
        }
    }));

    /**
     * Menu book: page grid from the menu PDF, search, and full-screen reader
     */
    Alpine.data('menuBook', () => ({
        ...overlayMixin(),
        ...swipeMixin(),
        book: MENU_BOOK,
        category: 'all',
        query: '',
        open: false,
        sequence: [],
        position: 0,
        zoom: false,
        imageLoading: true,

        get pages() {
            return this.book.pages.map((page, i) => ({
                ...page,
                number: i + 1,
                src: `images/menu-book/page-${String(i + 1).padStart(2, '0')}.webp`,
                thumb: `images/menu-book/page-${String(i + 1).padStart(2, '0')}-thumb.webp`
            }));
        },

        get visiblePages() {
            const q = normalizeSearch(this.query);
            if (q) return this.pages.filter(page => page.search.includes(q));
            if (this.category === 'all') return this.pages;
            return this.pages.filter(page => page.cat === this.category);
        },

        get current() {
            return this.pages[this.sequence[this.position] - 1] || this.pages[0];
        },

        countFor(categoryId) {
            return categoryId === 'all'
                ? this.book.pages.length
                : this.book.pages.filter(page => page.cat === categoryId).length;
        },

        categoryLabel(categoryId) {
            const found = this.book.categories.find(c => c.id === categoryId);
            return found ? found.label : '';
        },

        setCategory(categoryId) {
            this.category = categoryId;
            this.query = '';
        },

        openPage(number) {
            const list = this.visiblePages.map(page => page.number);
            this.sequence = list.includes(number) ? list : this.pages.map(page => page.number);
            this.position = this.sequence.indexOf(number);
            this.zoom = false;
            this.swipeDisabled = false;
            this.imageLoading = true;
            this.open = true;
            this.overlayOpened();
            this.afterChange();
        },

        close() {
            this.open = false;
            this.overlayClosed();
        },

        onOverlayClose() {
            this.open = false;
            lockScroll(false);
        },

        go(position) {
            if (position < 0 || position >= this.sequence.length || position === this.position) return;
            this.position = position;
            this.zoom = false;
            this.swipeDisabled = false;
            this.imageLoading = true;
            this.afterChange();
        },

        next() { this.go(this.position + 1); },
        prev() { this.go(this.position - 1); },

        afterChange() {
            // Preload neighbouring pages for instant flipping
            [this.position - 1, this.position + 1].forEach(p => {
                const n = this.sequence[p];
                if (n) new Image().src = this.pages[n - 1].src;
            });
            this.$nextTick(() => {
                const stage = this.$refs.stage;
                if (stage) stage.scrollTo(0, 0);
                const thumb = this.$refs.strip && this.$refs.strip.querySelector(`[data-pos="${this.position}"]`);
                if (thumb) thumb.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
            });
        },

        toggleZoom(event) {
            const stage = this.$refs.stage;
            const img = this.$refs.page;
            let rx = 0.5, ry = 0.3;
            if (event && img && !this.zoom) {
                const rect = img.getBoundingClientRect();
                rx = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
                ry = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
            }
            this.zoom = !this.zoom;
            this.swipeDisabled = this.zoom;
            this.$nextTick(() => {
                if (!stage) return;
                if (this.zoom) {
                    stage.scrollLeft = rx * stage.scrollWidth - stage.clientWidth / 2;
                    stage.scrollTop = ry * stage.scrollHeight - stage.clientHeight / 2;
                } else {
                    stage.scrollTo(0, 0);
                }
            });
        },

        onKey(e) {
            if (!this.open) return;
            if (e.key === 'Escape') this.zoom ? this.toggleZoom() : this.close();
            if (e.key === 'ArrowRight' && !this.zoom) this.next();
            if (e.key === 'ArrowLeft' && !this.zoom) this.prev();
            if (e.key === '+' || e.key === '=' || e.key === '-') this.toggleZoom();
        },

        orderUrl() {
            return waUrl(`Hi Haven Cafe, I'd like to order from the menu (page ${this.current.number}: ${this.current.title}).\n\nMy order:\n- `);
        }
    }));

    /**
     * Photo gallery with category filter and lightbox
     */
    Alpine.data('gallery', () => ({
        ...overlayMixin(),
        ...swipeMixin(),
        groups: GALLERY.groups,
        images: GALLERY.images,
        group: 'all',
        step: 12,
        limit: 12,
        open: false,
        position: 0,

        get filtered() {
            return this.group === 'all' ? this.images : this.images.filter(img => img.group === this.group);
        },

        get shown() {
            return this.filtered.slice(0, this.limit);
        },

        get current() {
            return this.filtered[this.position] || this.filtered[0];
        },

        countFor(groupId) {
            return groupId === 'all' ? this.images.length : this.images.filter(img => img.group === groupId).length;
        },

        groupLabel(groupId) {
            const found = this.groups.find(g => g.id === groupId);
            return found ? found.label : '';
        },

        // Larger tiles for some high-resolution photos to create rhythm in the grid
        isFeatured(img, index) {
            return index % 7 === 0 && img.w >= 500;
        },

        setGroup(groupId) {
            this.group = groupId;
            this.limit = this.step;
        },

        show(index) {
            this.position = index;
            this.open = true;
            this.overlayOpened();
            this.preload();
        },

        close() {
            this.open = false;
            this.overlayClosed();
        },

        onOverlayClose() {
            this.open = false;
            lockScroll(false);
        },

        next() {
            this.position = (this.position + 1) % this.filtered.length;
            this.preload();
        },

        prev() {
            this.position = (this.position - 1 + this.filtered.length) % this.filtered.length;
            this.preload();
        },

        preload() {
            const n = this.filtered.length;
            [this.position + 1, this.position - 1 + n].forEach(i => { new Image().src = this.filtered[i % n].src; });
        },

        onKey(e) {
            if (!this.open) return;
            if (e.key === 'Escape') this.close();
            if (e.key === 'ArrowRight') this.next();
            if (e.key === 'ArrowLeft') this.prev();
        }
    }));

    /**
     * Reservation form → WhatsApp message
     */
    Alpine.data('reservation', () => ({
        name: '',
        date: '',
        time: '',
        guests: '2',
        note: '',
        error: '',

        get today() {
            const now = new Date(Date.now() + OPENING_HOURS.utcOffset * 3600000);
            return now.toISOString().slice(0, 10);
        },

        get timeSlots() {
            const slots = [];
            for (let h = OPENING_HOURS.open; h < OPENING_HOURS.close; h++) {
                slots.push(`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`);
            }
            return slots;
        },

        get isTuesday() {
            return this.date !== '' && new Date(`${this.date}T12:00:00`).getDay() === OPENING_HOURS.closedDay;
        },

        submit() {
            this.error = '';
            if (!this.name.trim()) { this.error = 'Please enter your name.'; return; }
            if (!this.date || !this.time) { this.error = 'Please choose a date and time.'; return; }
            if (this.isTuesday) { this.error = 'We are closed on Tuesdays. Please choose another day.'; return; }

            const day = new Date(`${this.date}T12:00:00`).toLocaleDateString('en-GB', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            });
            const lines = [
                'Hi Haven Cafe, I would like to make a reservation:',
                '',
                `- Name: ${this.name.trim()}`,
                `- Date: ${day}`,
                `- Time: ${this.time}`,
                `- Guests: ${this.guests === '10+' ? 'More than 10 persons' : this.guests + (this.guests === '1' ? ' person' : ' persons')}`
            ];
            if (this.note.trim()) lines.push(`- Note: ${this.note.trim()}`);
            window.open(waUrl(lines.join('\n')), '_blank', 'noopener');
        }
    }));

    /**
     * Customer reviews loaded from data/ulasan.json
     */
    Alpine.data('reviews', () => ({
        items: [],
        expanded: null,

        async init() {
            try {
                const res = await fetch('./data/ulasan.json');
                if (!res.ok) throw new Error(res.statusText);
                this.items = await res.json();
            } catch (e) {
                console.error('Failed to load reviews', e);
            }
        }
    }));
});
