/**
 * Vlastní kalendář dovolených pro CIG
 * Nette Framework integration
 */
class VacationCalendar {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container with ID '${containerId}' not found`);
        }

        // Výchozí nastavení
        this.options = {
            locale: 'cs',
            firstDayOfWeek: 1, // Pondělí
            showWeekends: true,
            allowNavigation: true,
            showLegend: true,
            maxEventsPerDay: 3,
            onEventClick: null,
            onDayClick: null,
            onMonthChange: null,
            holidays: [],
            ...options
        };

        // Současný stav
        this.currentDate = new Date();
        this.currentView = 'month';
        this.events = [];
        this.isLoading = false;

        // Lokalizace
        this.locale = {
            cs: {
                months: [
                    'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
                    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
                ],
                monthsShort: [
                    'Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer',
                    'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'
                ],
                weekdays: ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'],
                weekdaysShort: ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'],
                weekdaysMin: ['N', 'P', 'Ú', 'S', 'Č', 'P', 'S'],
                today: 'Dnes',
                month: 'Měsíc',
                week: 'Týden',
                day: 'Den',
                prev: 'Předchozí',
                next: 'Další'
            }
        };

        this.init();
    }

    /**
     * Inicializace kalendáře
     */
    init() {
        this.render();
        this.attachEventListeners();
    }

    /**
     * Vykreslení kalendáře
     */
    render() {
        this.container.innerHTML = this.getCalendarHTML();
        this.renderEvents();
    }

    /**
     * HTML struktura kalendáře
     */
    getCalendarHTML() {
        const currentMonth = this.currentDate.getMonth();
        const currentYear = this.currentDate.getFullYear();
        const monthName = this.locale[this.options.locale].months[currentMonth];

        return `
            <div class="vacation-calendar">
                ${this.getHeaderHTML(monthName, currentYear)}
                ${this.getWeekdaysHTML()}
                ${this.getGridHTML()}
                ${this.isLoading ? '<div class="calendar-loading"><div class="calendar-spinner"></div>Načítám...</div>' : ''}
            </div>
            ${this.options.showLegend ? this.getLegendHTML() : ''}
        `;
    }

    /**
     * HTML hlavičky kalendáře
     */
    getHeaderHTML(monthName, year) {
        const locale = this.locale[this.options.locale];
        
        return `
            <div class="calendar-header">
                <div class="calendar-nav">
                    <button class="calendar-nav-btn" data-action="prev-month" ${!this.options.allowNavigation ? 'disabled' : ''}>
                        ‹ ${locale.prev}
                    </button>
                    <h2 class="calendar-title">${monthName} ${year}</h2>
                    <button class="calendar-nav-btn" data-action="next-month" ${!this.options.allowNavigation ? 'disabled' : ''}>
                        ${locale.next} ›
                    </button>
                </div>
                <div class="calendar-view-switcher">
                    <button class="view-btn ${this.currentView === 'month' ? 'active' : ''}" data-view="month">
                        ${locale.month}
                    </button>
                    <button class="view-btn ${this.currentView === 'week' ? 'active' : ''}" data-view="week">
                        ${locale.week}
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * HTML pro dny v týdnu
     */
    getWeekdaysHTML() {
        const locale = this.locale[this.options.locale];
        let weekdaysHTML = '';
        
        // Začneme od pondělí (firstDayOfWeek = 1)
        for (let i = 0; i < 7; i++) {
            const dayIndex = (this.options.firstDayOfWeek + i) % 7;
            const isWeekend = dayIndex === 0 || dayIndex === 6;
            
            weekdaysHTML += `
                <div class="calendar-weekday ${isWeekend ? 'weekend' : ''}">
                    ${locale.weekdaysShort[dayIndex]}
                </div>
            `;
        }

        return `<div class="calendar-weekdays">${weekdaysHTML}</div>`;
    }

    /**
     * HTML mřížky kalendáře
     */
    getGridHTML() {
        const days = this.getCalendarDays();
        let gridHTML = '';

        days.forEach(day => {
            const classes = this.getDayClasses(day);
            const dateStr = this.formatDate(day.date);
            
            gridHTML += `
                <div class="calendar-day ${classes.join(' ')}" data-date="${dateStr}">
                    <div class="day-number">${day.date.getDate()}</div>
                    <div class="vacation-events" data-date="${dateStr}">
                        <!-- Wydarzenia budou vloženy JavaScriptem -->
                    </div>
                </div>
            `;
        });

        return `<div class="calendar-grid">${gridHTML}</div>`;
    }

    /**
     * Získání dnů pro kalendářní mřížku
     */
    getCalendarDays() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // První den měsíce
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Najdeme začátek kalendářního období
        const startDate = new Date(firstDay);
        const dayOfWeek = firstDay.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Pondělí jako první den
        startDate.setDate(startDate.getDate() - daysToSubtract);

        // Generujeme 42 dnů (6 týdnů)
        const days = [];
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            days.push({
                date: date,
                isCurrentMonth: date.getMonth() === month,
                isToday: this.isToday(date),
                isWeekend: this.isWeekend(date),
                isHoliday: this.isHoliday(date)
            });
        }

        return days;
    }

    /**
     * CSS třídy pro den
     */
    getDayClasses(day) {
        const classes = [];
        
        if (!day.isCurrentMonth) classes.push('other-month');
        if (day.isToday) classes.push('today');
        if (day.isWeekend) classes.push('weekend');
        if (day.isHoliday) classes.push('holiday');
        
        return classes;
    }

    /**
     * Vykreslení událostí s track managementem
     */
    renderEvents() {
        // Nejdříve vyčistíme všechny kontejnery událostí
        this.container.querySelectorAll('.vacation-events').forEach(container => {
            container.innerHTML = '';
        });

        // Seskupíme události podle uživatelů a dat
        const groupedEvents = this.groupEventsByDateRange();
        
        // Přidělíme tracks (úrovně) pro události
        const eventsWithTracks = this.assignTracksToEvents(Object.values(groupedEvents));
        
        // Vykreslíme události přímo - CSS se postará o pozicování
        eventsWithTracks.forEach(eventGroup => {
            this.renderEventGroup(eventGroup);
        });
        
        // Přidáme indikátory "více událostí" kde je potřeba
        this.addMoreEventsIndicators();
    }

    /**
 * Přidání indikátorů "více událostí" pro dny s mnoha událostmi
 */
addMoreEventsIndicators() {
    const maxVisibleEvents = this.options.maxEventsPerDay || 3; // Reduce default visible events
    
    this.container.querySelectorAll('.vacation-events').forEach(container => {
        const events = container.querySelectorAll('.vacation-event');
        const dayElement = container.closest('.calendar-day');
        
        if (events.length > maxVisibleEvents) {
            // Skryjeme události nad limitem
            Array.from(events).slice(maxVisibleEvents).forEach(event => {
                event.style.display = 'none';
            });
            
            // Přidáme indikátor
            let moreIndicator = container.querySelector('.more-events');
            if (!moreIndicator) {
                moreIndicator = document.createElement('div');
                moreIndicator.className = 'more-events';
            }
            
            const hiddenCount = events.length - maxVisibleEvents;
            moreIndicator.textContent = `+${hiddenCount}`;
            moreIndicator.title = `Klikněte pro zobrazení všech ${events.length} událostí`;
            
            // Event listener pro zobrazení všech událostí
            moreIndicator.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Toggle expanded state
                if (dayElement.classList.contains('expanded')) {
                    dayElement.classList.remove('expanded');
                    // Hide events again
                    Array.from(events).slice(maxVisibleEvents).forEach(event => {
                        event.style.display = 'none';
                    });
                    moreIndicator.textContent = `+${hiddenCount}`;
                } else {
                    dayElement.classList.add('expanded');
                    // Show all events
                    events.forEach(event => {
                        event.style.display = 'block';
                    });
                    moreIndicator.textContent = 'Méně';
                }
            });
            
            container.appendChild(moreIndicator);
        }
    });
}

/**
 * Zobrazení všech událostí v daném dni
 */
showAllEventsInDay(container) {
    const dayElement = container.closest('.calendar-day');
    const events = container.querySelectorAll('.vacation-event');
    const moreIndicator = container.querySelector('.more-events');
    
    dayElement.classList.add('expanded');
    events.forEach(event => {
        event.style.display = 'block';
    });
    
    if (moreIndicator) {
        moreIndicator.textContent = 'Méně';
    }
}
    /**
     * Vykreslení skupiny událostí (kontinuální proužek) - zjednodušeno
     */
    renderEventGroup(eventGroup) {
        const dates = eventGroup.dates;
        const eventId = this.generateEventId(eventGroup);
        
        dates.forEach((date, index) => {
            const dateStr = this.formatDate(date);
            const container = this.container.querySelector(`.vacation-events[data-date="${dateStr}"]`);
            
            if (container) {
                const eventElement = this.createEventElement(eventGroup, index, dates.length);
                eventElement.dataset.track = eventGroup.track.toString();
                eventElement.dataset.eventId = eventId;
                
                // Přidáme hover event listenery
                this.addEventHoverListeners(eventElement, eventId);
                
                container.appendChild(eventElement);
            }
        });
    }

    /**
     * Generování unikátního ID pro událost
     */
    generateEventId(eventGroup) {
        const userId = (eventGroup.userName || '').replace(/\s+/g, '');
        const startDate = eventGroup.start_date.replace(/-/g, '');
        return `event_${userId}_${startDate}`;
    }

    /**
     * Přidání hover event listenerů pro zvýraznění celé události
     */
    addEventHoverListeners(element, eventId) {
        element.addEventListener('mouseenter', (e) => {
            this.highlightEvent(eventId, true);
        });
        
        element.addEventListener('mouseleave', (e) => {
            this.highlightEvent(eventId, false);
        });
    }

    /**
     * Zvýraznění/odzýraznění všech částí události
     */
    highlightEvent(eventId, highlight) {
        const eventElements = this.container.querySelectorAll(`[data-event-id="${eventId}"]`);
        
        eventElements.forEach((element) => {
            if (highlight) {
                element.classList.add('event-highlighted');
            } else {
                element.classList.remove('event-highlighted');
            }
        });
    }

    /**
     * Příprava mapy událostí pro každý den
     */
    prepareEventsByDate(events) {
        const eventsByDate = {};
        
        events.forEach(eventGroup => {
            const dates = eventGroup.dates;
            
            dates.forEach((date, index) => {
                const dateStr = this.formatDate(date);
                
                if (!eventsByDate[dateStr]) {
                    eventsByDate[dateStr] = [];
                }
                
                const eventElement = this.createEventElement(eventGroup, index, dates.length);
                eventElement.dataset.track = eventGroup.track.toString();
                
                const dayType = index === 0 ? 'start' : 
                              index === dates.length - 1 ? 'end' : 'middle';
                
                eventsByDate[dateStr].push({
                    track: eventGroup.track,
                    element: eventElement,
                    eventGroup: eventGroup,
                    dayIndex: index,
                    totalDays: dates.length,
                    dayType: dayType
                });
            });
        });
        
        // Debug výstup pro kontrolu - pouze pro dny s více událostmi
        Object.keys(eventsByDate).forEach(dateStr => {
            const dayEvents = eventsByDate[dateStr];
            if (dayEvents.length > 1) {
                console.log(`📅 Den ${dateStr} (${dayEvents.length} událostí):`);
                dayEvents.forEach((e, idx) => {
                    console.log(`  ${idx + 1}. ${e.eventGroup.userName} - track ${e.track} (${e.dayType})`);
                });
                
                // Seřadíme a znovu vypíšeme pořadí
                const sorted = [...dayEvents].sort((a, b) => a.track - b.track);
                console.log(`  📋 Seřazené pořadí:`, sorted.map(e => `${e.eventGroup.userName}(${e.track})`).join(', '));
            }
        });
        
        return eventsByDate;
    }

    /**
     * Přidělení tracks (úrovní) událostem pro správné řazení
     */
    assignTracksToEvents(events) {
        // Seřadíme události podle začátku, pak podle konce
        events.sort((a, b) => {
            const startA = new Date(a.start_date);
            const startB = new Date(b.start_date);
            if (startA.getTime() !== startB.getTime()) {
                return startA.getTime() - startB.getTime();
            }
            // Pokud začínají stejně, delší událost má prioritu (menší track)
            const endA = new Date(a.end_date);
            const endB = new Date(b.end_date);
            return endB.getTime() - endA.getTime();
        });

        // Vytvoříme interval timeline pro lepší sledování překryvů
        const timeline = [];
        
        events.forEach((event, index) => {
            const eventStart = new Date(event.start_date);
            const eventEnd = new Date(event.end_date);
            
            // Najdeme nejnižší dostupný track
            let trackIndex = 0;
            let foundTrack = false;
            
            while (!foundTrack) {
                // Zkontrolujeme, zda je track volný v celém období události
                let isTrackFree = true;
                
                for (let assignedEvent of timeline) {
                    if (assignedEvent.track === trackIndex) {
                        const assignedStart = new Date(assignedEvent.start_date);
                        const assignedEnd = new Date(assignedEvent.end_date);
                        
                        // Kontrola překrývání
                        if (eventStart <= assignedEnd && eventEnd >= assignedStart) {
                            isTrackFree = false;
                            break;
                        }
                    }
                }
                
                if (isTrackFree) {
                    // Našli jsme volný track
                    event.track = trackIndex;
                    timeline.push(event);
                    foundTrack = true;
                } else {
                    // Zkusíme další track
                    trackIndex++;
                }
            }
        });
        
        return events;
    }

    /**
     * Seskupení událostí podle období
     */
    groupEventsByDateRange() {
        const grouped = {};
        
        this.events.forEach(event => {
            const key = `${event.user_id}_${event.start_date}_${event.end_date}_${event.type}`;
            
            if (!grouped[key]) {
                grouped[key] = {
                    ...event,
                    dates: this.getDateRange(new Date(event.start_date), new Date(event.end_date))
                };
            }
        });
        
        return grouped;
    }

    /**
     * Vytvoření HTML elementu události
     */
    createEventElement(event, dayIndex, totalDays) {
        const element = document.createElement('div');
        
        // Základní třídy
        const classes = ['vacation-event', event.status];
        if (event.type !== 'vacation') {
            classes.push(event.type);
        }

        // Pozice v sekvenci
        if (totalDays === 1) {
            classes.push('single');
        } else if (dayIndex === 0) {
            classes.push('start');
        } else if (dayIndex === totalDays - 1) {
            classes.push('end');
        } else {
            classes.push('middle');
        }

        element.className = classes.join(' ');
        
        // Text - zobrazujeme jen na začátku nebo u jednodení události
        if (totalDays === 1 || dayIndex === 0) {
            const textSpan = document.createElement('span');
            textSpan.className = 'event-text';
            textSpan.textContent = this.getEventDisplayText(event);
            element.appendChild(textSpan);
        }

        // Tooltip
        element.title = this.getEventTooltip(event);
        
        // Data pro event listener
        element.dataset.eventId = event.id || '';
        element.dataset.userId = event.user_id || '';
        
        return element;
    }

    /**
     * Text pro zobrazení události
     */
    getEventDisplayText(event) {
        if (event.userName) {
            return event.userName.split(' ')[0]; // Pouze křestní jméno
        }
        return event.user_id || 'Neznámý';
    }

    /**
     * Tooltip text
     */
    getEventTooltip(event) {
        const startDate = new Date(event.start_date).toLocaleDateString('cs-CZ');
        const endDate = new Date(event.end_date).toLocaleDateString('cs-CZ');
        const type = this.getTypeLabel(event.type);
        const status = this.getStatusLabel(event.status);
        
        return `${event.userName || 'Neznámý uživatel'}\n${type} (${status})\n${startDate} - ${endDate}`;
    }

    /**
     * Překlad typu dovolené
     */
    getTypeLabel(type) {
        const labels = {
            'vacation': 'Dovolená',
            'sick_leave': 'Nemocenská',
            'other': 'Jiné'
        };
        return labels[type] || type;
    }

    /**
     * Překlad stavu
     */
    getStatusLabel(status) {
        const labels = {
            'approved': 'Schváleno',
            'pending': 'Čeká na schválení',
            'rejected': 'Zamítnuto'
        };
        return labels[status] || status;
    }

    /**
     * HTML legendy
     */
    getLegendHTML() {
        return `
            <div class="calendar-legend">
                <div class="legend-item">
                    <div class="legend-color" style="background: #10b981;"></div>
                    <span>Schváleno</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #f59e0b;"></div>
                    <span>Čeká na schválení</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #ef4444;"></div>
                    <span>Zamítnuto</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #8b5cf6;"></div>
                    <span>Nemocenská</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #6b7280;"></div>
                    <span>Jiné</span>
                </div>
            </div>
        `;
    }

    /**
     * Připojení event listenerů
     */
    attachEventListeners() {
        // Navigace měsíců
        this.container.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'prev-month') {
                this.previousMonth();
            } else if (e.target.dataset.action === 'next-month') {
                this.nextMonth();
            } else if (e.target.dataset.view) {
                this.setView(e.target.dataset.view);
            } else if (e.target.closest('.vacation-event')) {
                this.handleEventClick(e.target.closest('.vacation-event'));
            } else if (e.target.closest('.calendar-day')) {
                this.handleDayClick(e.target.closest('.calendar-day'));
            }
        });
    }

    /**
     * Navigace - předchozí měsíc
     */
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
        
        if (this.options.onMonthChange) {
            this.options.onMonthChange(this.currentDate);
        }
    }

    /**
     * Navigace - následující měsíc
     */
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
        
        if (this.options.onMonthChange) {
            this.options.onMonthChange(this.currentDate);
        }
    }

    /**
     * Změna pohledu
     */
    setView(view) {
        this.currentView = view;
        this.render();
        
        // Zatím podporujeme jen měsíční pohled
        if (view === 'week') {
            console.warn('Týdenní pohled není zatím implementován');
        }
    }

    /**
     * Klik na událost
     */
    handleEventClick(eventElement) {
        if (this.options.onEventClick) {
            const eventData = {
                id: eventElement.dataset.eventId,
                userId: eventElement.dataset.userId
            };
            this.options.onEventClick(eventData, eventElement);
        }
    }

    /**
     * Klik na den
     */
    handleDayClick(dayElement) {
        if (this.options.onDayClick) {
            const date = new Date(dayElement.dataset.date);
            this.options.onDayClick(date, dayElement);
        }
    }

    /**
     * Nastavení událostí
     */
    setEvents(events) {
        this.events = events || [];
        this.renderEvents();
    }

    /**
     * Přidání události
     */
    addEvent(event) {
        this.events.push(event);
        this.renderEvents();
    }

    /**
     * Odebrání události
     */
    removeEvent(eventId) {
        this.events = this.events.filter(event => event.id !== eventId);
        this.renderEvents();
    }

    /**
     * Zobrazení loading stavu
     */
    setLoading(loading) {
        this.isLoading = loading;
        this.render();
    }

    /**
     * Pomocné metody
     */
    
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6;
    }

    isHoliday(date) {
        const dateStr = this.formatDate(date);
        return this.options.holidays.includes(dateStr);
    }

    getDateRange(startDate, endDate) {
        const dates = [];
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return dates;
    }

    /**
     * Veřejné API
     */
    
    // Přechod na konkrétní měsíc
    goToMonth(year, month) {
        this.currentDate = new Date(year, month, 1);
        this.render();
    }
    
    // Přechod na dnešní datum
    goToToday() {
        this.currentDate = new Date();
        this.render();
    }
    
    // Získání aktuálního data
    getCurrentDate() {
        return new Date(this.currentDate);
    }
    
    // Aktualizace nastavení
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        this.render();
    }
}

// Export pro použití v Nette
window.VacationCalendar = VacationCalendar;