document.addEventListener('DOMContentLoaded', () => {
    // --- Element Caching ---
    const eventForm = document.getElementById('eventForm');
    const eventListElement = document.getElementById('eventList');
    const timelineSvg = document.getElementById('timelineSvg');
    const timelineSvgWrapper = document.getElementById('timelineSvgWrapper');
    const opListElement = document.getElementById('opList');
    const probeListElement = document.getElementById('probeList');
    const antibioticListElement = document.getElementById('antibioticList');
    const timelineStatus = document.getElementById('timelineStatus');
    const clearAllButton = document.getElementById('clearAllButton');
    const copyPatientDataButton = document.getElementById('copyPatientDataButton');
    const copyOpsButton = document.getElementById('copyOpsButton');
    const copyProbesButton = document.getElementById('copyProbesButton');
    const copyAntibioticsButton = document.getElementById('copyAntibioticsButton');
    const printTimelineButton = document.getElementById('printTimelineButton');
    const fullscreenTimelineButton = document.getElementById('fullscreenTimelineButton'); // New button
    // Patient Info Inputs
    const patientNameInput = document.getElementById('patientName');
    const patientDobInput = document.getElementById('patientDob');
    const patientDiagnosisInput = document.getElementById('patientDiagnosis');
    const patientTeamInput = document.getElementById('patientTeam');
    const infektioInvolviertCheckbox = document.getElementById('infektioInvolviert');
    const plwcInvolviertCheckbox = document.getElementById('plwcInvolviert');
    const orthoTeamSelect = document.getElementById('orthoTeam');
    // Event Inputs
    const eventDateInput = document.getElementById('eventDate');
    const eventTypeInput = document.getElementById('eventType');
    const eventDetailsInput = document.getElementById('eventDetails');
    const eventDetailsLabel = document.getElementById('eventDetailsLabel');
    // Probe Inputs
    const probeFields = document.getElementById('probeFields');
    const probeArtInput = document.getElementById('probeArt');
    const probeKeimInput = document.getElementById('probeKeim');

    // --- Global State ---
    let events = [];
    const SVG_NS = "http://www.w3.org/2000/svg";

    // --- Localization & Date Formatting ---
    const lang = 'de-CH';
    const dateFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const monthYearFormatOptions = { year: 'numeric', month: 'short' };
    const dayMonthFormatOptions = { month: 'short', day: 'numeric' };
    const dateLocaleFormat = (dateStr) => { if (!dateStr || typeof dateStr !== 'string') return 'N/A'; try { const [year, month, day] = dateStr.split('-'); if (!year || !month || !day || year.length !== 4) return dateStr; const date = new Date(Date.UTC(year, month - 1, day)); if (isNaN(date.getTime())) return 'Ungültiges Datum'; return date.toLocaleDateString(lang, dateFormatOptions); } catch (e) { console.error("Error formatting date:", dateStr, e); return 'Fehler'; } };

    // --- Event Handling ---
    function handleEventTypeChange() { /* No changes */ const selectedType = eventTypeInput.value; probeFields.style.display = selectedType === 'Probenentnahme' ? 'flex' : 'none'; switch (selectedType) { case 'OP': eventDetailsLabel.textContent = 'OP Details:'; eventDetailsInput.placeholder = 'Beschreibung der Operation...'; eventDetailsInput.required = true; break; case 'Antibiotika Start': case 'Antibiotika Ende': eventDetailsLabel.textContent = 'Antibiotikum / Dosis:'; eventDetailsInput.placeholder = 'z.B. Co-Amoxicillin 1.2g iv'; eventDetailsInput.required = (selectedType === 'Antibiotika Start'); break; case 'Labor CRP': eventDetailsLabel.textContent = 'CRP Wert (mg/l):'; eventDetailsInput.placeholder = 'Numerischer Wert, z.B. 50.5'; eventDetailsInput.required = true; break; case 'Labor Lc': eventDetailsLabel.textContent = 'Lc Wert (G/l):'; eventDetailsInput.placeholder = 'Numerischer Wert, z.B. 12.3'; eventDetailsInput.required = true; break; case 'Probenentnahme': eventDetailsLabel.textContent = 'Zusätzliche Details zur Probe:'; eventDetailsInput.placeholder = '(Optional) z.B. Entnahmeort...'; eventDetailsInput.required = false; break; default: eventDetailsLabel.textContent = 'Details / Wert:'; eventDetailsInput.placeholder = 'Details...'; eventDetailsInput.required = false; } }
    function handleEventSubmit(e) { /* No changes */ e.preventDefault(); const eventType = eventTypeInput.value; const eventDate = eventDateInput.value; const eventDetails = eventDetailsInput.value.trim(); const probeArt = probeArtInput.value; const probeKeim = probeKeimInput.value.trim(); if (!eventDate) { alert('Bitte Datum auswählen.'); return; } if (!eventType) { alert('Bitte Ereignistyp auswählen.'); return; } let newEvent = { id: Date.now(), date: eventDate, type: eventType }; switch (eventType) { case 'OP': case 'Antibiotika Start': if (!eventDetails) { alert(`Bitte Details für ${eventType} eingeben.`); return; } newEvent.details = eventDetails; break; case 'Antibiotika Ende': newEvent.details = eventDetails; break; case 'Labor CRP': case 'Labor Lc': const numericValue = parseFloat(eventDetails); if (isNaN(numericValue)) { alert(`Bitte einen gültigen numerischen Wert für ${eventType} eingeben.`); return; } newEvent.details = numericValue.toString(); break; case 'Probenentnahme': if (!probeArt) { alert('Bitte Probenart auswählen.'); return; } if (!probeKeim) { alert('Bitte nachgewiesenen Keim eingeben (oder "Negativ").'); return; } newEvent.sampleType = probeArt; newEvent.germ = probeKeim; newEvent.details = eventDetails; break; default: console.error("Unbekannter Ereignistyp:", eventType); return; } events.push(newEvent); events.sort((a, b) => new Date(a.date) - new Date(b.date)); saveData(); render(); eventForm.reset(); handleEventTypeChange(); eventDateInput.focus(); }
    function handleClearAll() { /* No changes */ if (confirm('Sind Sie sicher, dass Sie alle eingegebenen Ereignisse UND Patientendaten löschen möchten? Dies kann nicht rückgängig gemacht werden.')) { events = []; patientNameInput.value = ''; patientDobInput.value = ''; patientDiagnosisInput.value = ''; patientTeamInput.value = ''; infektioInvolviertCheckbox.checked = false; plwcInvolviertCheckbox.checked = false; orthoTeamSelect.selectedIndex = 0; saveData(); render(); } }
    function handlePrintTimeline() { /* No changes */ if (events.length === 0) { alert("Es gibt keine Ereignisse zum Drucken der Timeline."); return; } renderTimeline(); setTimeout(() => { document.body.classList.add('printing-timeline-only'); window.print(); setTimeout(() => { document.body.classList.remove('printing-timeline-only'); }, 500); }, 150); }
    function handleDeleteEvent(eventId) { /* No changes */ const eventIndex = events.findIndex(event => event.id === eventId); if (eventIndex > -1) { const eventToDelete = events[eventIndex]; if (confirm(`Soll das Ereignis "${dateLocaleFormat(eventToDelete.date)} - ${eventToDelete.type}: ${ (eventToDelete.details || eventToDelete.germ || '').substring(0,30)}..." wirklich gelöscht werden?`)) { events.splice(eventIndex, 1); saveData(); render(); } } }

    // --- Fullscreen Handling ---
    function handleFullscreenToggle() {
        if (!document.fullscreenElement) {
            // Enter fullscreen
            timelineSvgWrapper.requestFullscreen()
                .then(() => {
                    // Optional: Add a class for specific fullscreen styles if needed beyond :fullscreen pseudo-class
                    timelineSvgWrapper.classList.add('is-fullscreen');
                    // Optional: Re-render timeline if needed for fullscreen adjustments
                    // renderTimeline();
                })
                .catch(err => {
                    alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen()
                .then(() => {
                    timelineSvgWrapper.classList.remove('is-fullscreen');
                     // Optional: Re-render timeline if needed after exiting
                    // renderTimeline();
                })
                .catch(err => {
                     alert(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
                });
            }
        }
    }

    // Update fullscreen button text when state changes
    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement === timelineSvgWrapper) {
            fullscreenTimelineButton.textContent = 'Vollbild verlassen';
        } else {
            fullscreenTimelineButton.textContent = 'Vollbild';
             timelineSvgWrapper.classList.remove('is-fullscreen'); // Ensure class is removed
        }
    });


    // --- Attach Event Listeners ---
    eventForm.addEventListener('submit', handleEventSubmit);
    clearAllButton.addEventListener('click', handleClearAll);
    printTimelineButton.addEventListener('click', handlePrintTimeline);
    fullscreenTimelineButton.addEventListener('click', handleFullscreenToggle); // Attach listener
    eventTypeInput.addEventListener('change', handleEventTypeChange);
    [patientNameInput, patientDobInput, patientDiagnosisInput, patientTeamInput, infektioInvolviertCheckbox, plwcInvolviertCheckbox, orthoTeamSelect].forEach(element => { if(element) element.addEventListener('change', saveData); });
    copyPatientDataButton.addEventListener('click', copyPatientDataToClipboard);
    copyOpsButton.addEventListener('click', () => copySummaryToClipboard('opList', 'Übersicht OPs', ['Datum', 'Details'], copyOpsButton));
    copyProbesButton.addEventListener('click', () => copySummaryToClipboard('probeList', 'Übersicht Probenentnahmen', ['Datum', 'Art', 'Keim', 'Details'], copyProbesButton));
    copyAntibioticsButton.addEventListener('click', () => copySummaryToClipboard('antibioticList', 'Übersicht Antibiotika', ['Zeitraum', 'Details'], copyAntibioticsButton));

    // --- Local Storage ---
    const STORAGE_KEY_EVENTS = 'patientTimelineEvents_v11'; // Increment version
    const STORAGE_KEY_PATIENT = 'patientTimelinePatientData_v11';

    function saveData() { /* No changes */ try { localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events)); const patientData = { name: patientNameInput.value, dob: patientDobInput.value, diagnosis: patientDiagnosisInput.value, team: patientTeamInput.value, infektio: infektioInvolviertCheckbox.checked, plwc: plwcInvolviertCheckbox.checked, ortho: orthoTeamSelect.value }; localStorage.setItem(STORAGE_KEY_PATIENT, JSON.stringify(patientData)); } catch (e) { console.error("Fehler beim Speichern:", e); alert("Fehler beim Speichern.");} }
    function loadData() { /* No changes */ try { const storedEvents = localStorage.getItem(STORAGE_KEY_EVENTS); events = storedEvents ? JSON.parse(storedEvents) : []; if (!Array.isArray(events)) { events = []; } else { events = events.filter(event => event && typeof event.date === 'string' && event.date.match(/^\d{4}-\d{2}-\d{2}$/)); events.forEach(event => { if (event.type === 'Probenentnahme') { event.sampleType = event.sampleType || ''; event.germ = event.germ || ''; }}); events.sort((a, b) => new Date(a.date) - new Date(b.date)); } const storedPatientData = localStorage.getItem(STORAGE_KEY_PATIENT); if (storedPatientData) { const data = JSON.parse(storedPatientData); if (typeof data === 'object' && data !== null) { patientNameInput.value = data.name || ''; patientDobInput.value = data.dob || ''; patientDiagnosisInput.value = data.diagnosis || ''; patientTeamInput.value = data.team || ''; infektioInvolviertCheckbox.checked = data.infektio || false; plwcInvolviertCheckbox.checked = data.plwc || false; orthoTeamSelect.value = data.ortho || ''; } } } catch (e) { console.error("Fehler Laden:", e); alert("Fehler Laden."); events = []; } render(); }


    // --- Rendering Functions ---
    function render() {
        try { renderEventList(); } catch (e) { console.error("Fehler renderEventList:", e); }
        try { renderSummaries(); } catch (e) { console.error("Fehler renderSummaries:", e); }
        try {
             renderTimeline(); // Render timeline
             timelineStatus.style.display = events.length > 0 ? 'none' : 'block';
             timelineSvgWrapper.style.display = events.length > 0 ? 'block' : 'none';
             // Enable/disable fullscreen button based on events
             fullscreenTimelineButton.disabled = events.length === 0;
        } catch (e) {
             console.error("Fehler renderTimeline:", e); timelineSvg.innerHTML = ''; timelineStatus.textContent = "Fehler beim Rendern der Timeline. Details in der Konsole (F12)."; timelineStatus.style.color = 'red'; timelineStatus.style.display = 'block'; timelineSvgWrapper.style.display = 'none'; fullscreenTimelineButton.disabled = true;
        }
    }

    function renderEventList() { /* No changes */ eventListElement.innerHTML = ''; if (events.length === 0) { eventListElement.innerHTML = '<li>Noch keine Ereignisse hinzugefügt.</li>'; return; } const typeMap = { 'OP': 'OP', 'Antibiotika Start': 'AB Start', 'Antibiotika Ende': 'AB Ende', 'Probenentnahme': 'Probe', 'Labor CRP': 'CRP', 'Labor Lc': 'Lc' }; events.forEach(event => { const li = document.createElement('li'); const textSpan = document.createElement('span'); const displayType = typeMap[event.type] || event.type; let displayText = `${dateLocaleFormat(event.date)} - ${displayType}: `; switch(event.type) { case 'OP': case 'Antibiotika Start': case 'Antibiotika Ende': displayText += event.details || ''; break; case 'Labor CRP': displayText += `${event.details} mg/l`; break; case 'Labor Lc': displayText += `${event.details} G/l`; break; case 'Probenentnahme': displayText += `${event.sampleType || '?'} - Keim: ${event.germ || '?'} ${event.details ? `(${event.details})` : ''}`; break; default: displayText += event.details || ''; } textSpan.textContent = displayText; li.appendChild(textSpan); const deleteButton = document.createElement('button'); deleteButton.textContent = '✕'; deleteButton.title = "Löschen"; deleteButton.classList.add('delete-button'); deleteButton.onclick = () => handleDeleteEvent(event.id); li.appendChild(deleteButton); eventListElement.appendChild(li); }); }
    function renderSummaries() { /* No changes */ opListElement.innerHTML = ''; probeListElement.innerHTML = ''; antibioticListElement.innerHTML = ''; const ops = events.filter(e => e.type === 'OP'); const probes = events.filter(e => e.type === 'Probenentnahme'); const antibioticStarts = events.filter(e => e.type === 'Antibiotika Start').sort((a,b) => new Date(a.date) - new Date(b.date)); const antibioticEnds = events.filter(e => e.type === 'Antibiotika Ende').sort((a,b) => new Date(a.date) - new Date(b.date)); if (ops.length === 0) opListElement.innerHTML = '<li>Keine OPs.</li>'; else ops.forEach(op => opListElement.innerHTML += `<li><span class="date">${dateLocaleFormat(op.date)}:</span> ${escapeHtml(op.details)}</li>`); if (probes.length === 0) probeListElement.innerHTML = '<li>Keine Proben.</li>'; else probes.forEach(probe => { probeListElement.innerHTML += `<li><span class="date">${dateLocaleFormat(probe.date)}:</span> Art: ${escapeHtml(probe.sampleType || '?')} - Keim: ${escapeHtml(probe.germ || '?')} ${probe.details ? `(${escapeHtml(probe.details)})` : ''}</li>`; }); const antibiotics = []; let usedEndIds = new Set(); antibioticStarts.forEach(start => { const startDrugName = start.details ? start.details.split(' ')[0].trim().toLowerCase() : null; let matchedEnd = null; const potentialEnds = antibioticEnds.filter(end => !usedEndIds.has(end.id) && new Date(end.date) >= new Date(start.date)).sort((a, b) => { const dateDiff = new Date(a.date) - new Date(b.date); if (dateDiff !== 0) return dateDiff; const aMatches = a.details && startDrugName && a.details.toLowerCase().includes(startDrugName); const bMatches = b.details && startDrugName && b.details.toLowerCase().includes(startDrugName); if (aMatches && !bMatches) return -1; if (!aMatches && bMatches) return 1; if (!a.details && b.details && !bMatches) return -1; if (a.details && !aMatches && !b.details) return 1; return 0; }); for (const end of potentialEnds) { const endDrugName = end.details ? end.details.split(' ')[0].trim().toLowerCase() : null; if ( (startDrugName && endDrugName && endDrugName === startDrugName) || !endDrugName || !startDrugName ) { matchedEnd = end; usedEndIds.add(matchedEnd.id); break; } } antibiotics.push({ start: start.date, end: matchedEnd ? matchedEnd.date : null, details: start.details || '' }); }); if (antibiotics.length === 0) antibioticListElement.innerHTML = '<li>Keine ABs.</li>'; else antibiotics.sort((a,b) => new Date(a.start) - new Date(b.start)).forEach(ab => { const endDateFormatted = ab.end ? dateLocaleFormat(ab.end) : 'Laufend'; antibioticListElement.innerHTML += `<li><span class="date">${dateLocaleFormat(ab.start)} bis ${endDateFormatted}:</span> ${escapeHtml(ab.details) || '(Details fehlen)'}</li>`; }); }


    // --- Timeline Rendering (REVISED Layout/Sizing) ---
    function renderTimeline() {
        timelineSvg.innerHTML = ''; // Clear previous render

        const validEvents = events.filter(e => e.date && typeof e.date === 'string');
        if (validEvents.length === 0) { return; }

        const allDates = validEvents.map(e => new Date(e.date)).filter(d => !isNaN(d.getTime()));
        const antibioticEndsDates = events.filter(e => e.type === 'Antibiotika Ende' && e.date).map(e => new Date(e.date)).filter(d => !isNaN(d.getTime()));
        allDates.push(...antibioticEndsDates);
        if (allDates.length === 0) { return; }

        // --- Calculate Antibiotic Periods and Rows ---
        const antibioticPeriods = calculateAntibioticPeriods(validEvents);
        const { assignedPeriods, maxRows: antibioticRowCount } = assignAntibioticRows(antibioticPeriods);
        const antibioticRowHeight = 25; // Increased height per AB row for bigger font
        const totalAntibioticHeight = Math.max(1, antibioticRowCount) * antibioticRowHeight;

        // --- Setup - INCREASED Row Heights & Margins for Larger Fonts ---
        const baseRowHeight = 40;      // Increased base height for OP row
        const textRowHeight = 35;      // Increased height for text-based rows
        const rowGap = 25;             // Increased gap between row types
        const verticalTextOffset = 15; // Base offset for overlapping text

        const opY = 0;
        const antibioticStartY = opY + baseRowHeight + rowGap;
        const probeY = antibioticStartY + totalAntibioticHeight + rowGap;
        const laborY = probeY + textRowHeight + rowGap;

        const margin = { top: 60, right: 60, bottom: 90, left: 150 }; // Increased margins significantly
        const dynamicHeight = laborY + textRowHeight; // Total height needed for content rows
        const svgHeight = dynamicHeight + margin.top + margin.bottom;

        // --- Calculate SVG Width ---
        let minDate = new Date(Math.min(...allDates)); let maxDate = new Date(Math.max(...allDates));
        if (isNaN(minDate.getTime()) || isNaN(maxDate.getTime())) { console.error("Invalid min/max date"); return; }
        const timeDiffMs = maxDate.getTime() - minDate.getTime();
        const datePaddingMs = Math.max(timeDiffMs * 0.05, 3 * 24 * 60 * 60 * 1000); // More padding
        if (timeDiffMs === 0) { minDate = new Date(minDate.getTime() - datePaddingMs); maxDate = new Date(maxDate.getTime() + datePaddingMs); }
        else { minDate = new Date(minDate.getTime() - datePaddingMs); maxDate = new Date(maxDate.getTime() + datePaddingMs); }
        const totalTime = maxDate.getTime() - minDate.getTime();
        if (totalTime <= 0) { console.error("Total time range is zero or negative"); return; }

        // Calculate a minimum width based on date range and desired tick spacing
        const daysInRange = totalTime / (1000 * 60 * 60 * 24);
        const minTickSpacing = 120; // Pixels desired between major ticks (adjust as needed)
        const estimatedTicks = Math.max(5, daysInRange / 5); // Estimate ticks roughly
        const calculatedMinWidth = estimatedTicks * minTickSpacing;

        // Use calculated minimum or a default large width, ensure it fits within margins
        const contentWidth = Math.max(calculatedMinWidth, 1400); // Min content width
        const svgWidth = contentWidth + margin.left + margin.right;
        const width = contentWidth; // This is the actual drawing area width
        const height = dynamicHeight;

        // --- SVG Canvas ---
        // Use viewBox for scaling. Width/Height attributes control aspect ratio box.
        timelineSvg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
        // Preserve aspect ratio, let SVG scale within the wrapper
        timelineSvg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
        // Set a style min-width on the SVG itself to ensure the wrapper scrolls
        timelineSvg.style.minWidth = `${svgWidth}px`;
        // The wrapper's overflow:auto should now handle scrolling

        const chartGroup = document.createElementNS(SVG_NS, "g");
        chartGroup.setAttribute('transform', `translate(${margin.left},${margin.top})`);
        timelineSvg.appendChild(chartGroup);

        // --- Scales ---
        const xScale = (date) => { if (!(date instanceof Date) || isNaN(date.getTime())) { console.warn("Invalid date passed to xScale:", date); return 0;} const timeOffset = date.getTime() - minDate.getTime(); return Math.max(0, Math.min(width, (timeOffset / totalTime) * width)); };

        // --- Draw Axes ---
        // X Axis
        const xAxisLine = document.createElementNS(SVG_NS, "line"); xAxisLine.setAttribute('x1', 0); xAxisLine.setAttribute('y1', height); xAxisLine.setAttribute('x2', width); xAxisLine.setAttribute('y2', height); xAxisLine.setAttribute('class', 'axis-line'); chartGroup.appendChild(xAxisLine);
        const tickInterval = calculateTickInterval(totalTime, width); let currentTickDate = getFirstTickDate(minDate, tickInterval.unit); let safety = 0;
        const tickLabelY = height + 35; // Increased distance for larger font
        const tickMarkY1 = height; const tickMarkY2 = height + 8; // Longer ticks
        const gridLineY1 = 0; const gridLineY2 = height;
        while (currentTickDate <= maxDate && safety < 200) { const xPos = xScale(currentTickDate); if (xPos >= 0 && xPos <= width) { const gridLine = document.createElementNS(SVG_NS, "line"); gridLine.setAttribute('x1', xPos); gridLine.setAttribute('y1', gridLineY1); gridLine.setAttribute('x2', xPos); gridLine.setAttribute('y2', gridLineY2); gridLine.setAttribute('class', 'grid-line'); chartGroup.appendChild(gridLine); const tickMark = document.createElementNS(SVG_NS, "line"); tickMark.setAttribute('x1', xPos); tickMark.setAttribute('y1', tickMarkY1); tickMark.setAttribute('x2', xPos); tickMark.setAttribute('y2', tickMarkY2); tickMark.setAttribute('class', 'axis-tick'); chartGroup.appendChild(tickMark); const tickLabel = document.createElementNS(SVG_NS, "text"); tickLabel.setAttribute('x', xPos); tickLabel.setAttribute('y', tickLabelY); tickLabel.setAttribute('class', 'axis-tick'); tickLabel.textContent = formatTickDate(currentTickDate, tickInterval.unit); chartGroup.appendChild(tickLabel); } const tempDate = new Date(currentTickDate); if (tickInterval.unit === 'day') tempDate.setUTCDate(tempDate.getUTCDate() + tickInterval.step); else if (tickInterval.unit === 'week') tempDate.setUTCDate(tempDate.getUTCDate() + 7 * tickInterval.step); else if (tickInterval.unit === 'month') tempDate.setUTCMonth(tempDate.getUTCMonth() + tickInterval.step); else tempDate.setUTCDate(tempDate.getUTCDate() + 1); if (tempDate <= currentTickDate) { break; } currentTickDate = tempDate; safety++; }

        // Y Axis Labels
        const yLabels = [ { y: opY + baseRowHeight / 2, text: 'OPs' }, { y: antibioticStartY + totalAntibioticHeight / 2, text: 'Antibiotika' }, { y: probeY + textRowHeight / 2, text: 'Probenentnahme' }, { y: laborY + textRowHeight / 2, text: 'Labor' } ];
        yLabels.forEach(label => { const textElement = document.createElementNS(SVG_NS, "text"); textElement.setAttribute('x', -20); /* Further left */ textElement.setAttribute('y', label.y); textElement.setAttribute('class', 'axis-label'); textElement.setAttribute('dominant-baseline', 'middle'); textElement.textContent = label.text; chartGroup.appendChild(textElement); });

        // --- Draw Events ---
        try {
            // Draw Antibiotic Bars
            const barHeight = antibioticRowHeight * 0.7;
            assignedPeriods.forEach(period => { const xStart = xScale(period.startDate); const xEnd = xScale(period.endDate ? period.endDate : maxDate); const barWidth = Math.max(1, xEnd - xStart); const rowCenterY = antibioticStartY + period.row * antibioticRowHeight + antibioticRowHeight / 2; const barY = rowCenterY - barHeight / 2; if (barWidth > 0 && xStart < width) { const rect = document.createElementNS(SVG_NS, "rect"); rect.setAttribute('x', xStart); rect.setAttribute('y', barY); rect.setAttribute('width', barWidth); rect.setAttribute('height', barHeight); rect.setAttribute('class', 'antibiotic-bar'); rect.setAttribute('rx', 4); rect.setAttribute('ry', 4); chartGroup.appendChild(rect); const label = document.createElementNS(SVG_NS, "text"); label.setAttribute('x', xStart + 8); label.setAttribute('y', rowCenterY); label.setAttribute('class', 'bar-text-label'); let drugName = period.details.split(' ')[0] || '(Unbekannt)'; if (barWidth < 40 && drugName.length > 3) { drugName = drugName.substring(0,1) + '.'; } else if (drugName.length > 20) { drugName = drugName.substring(0, 19) + '…'; } label.textContent = drugName; if (barWidth > 15) { chartGroup.appendChild(label); } } });

            // Draw OPs, Probes, Labs as Text Labels
            const textPositions = {}; const labelPadding = 8; // Horizontal padding
             const maxLabelLength = 45; // Max characters before truncating labels

            validEvents.forEach(event => {
                const date = new Date(event.date); if (isNaN(date.getTime())) return;
                const x = xScale(date);
                let yBase, labelClass, labelText = '', markerSize = 0;
                const dateString = event.date;

                switch (event.type) {
                    case 'OP': yBase = opY + baseRowHeight / 2; labelClass = 'op-label'; markerSize = 10; /* Larger marker */ labelText = event.details; const opMarker = document.createElementNS(SVG_NS, "rect"); opMarker.setAttribute('x', x - markerSize / 2); opMarker.setAttribute('y', yBase - markerSize / 2); opMarker.setAttribute('width', markerSize); opMarker.setAttribute('height', markerSize); opMarker.setAttribute('class', 'op-marker marker-base'); opMarker.setAttribute('transform', `rotate(45 ${x} ${yBase})`); chartGroup.appendChild(opMarker); break;
                    case 'Probenentnahme': yBase = probeY + textRowHeight / 2; labelClass = 'probe-label'; labelText = `${event.sampleType || '?'} (${event.germ || '?'})`; break;
                    case 'Labor CRP': yBase = laborY + textRowHeight / 2; labelClass = 'labor-label'; labelText = `CRP: ${event.details}`; break;
                    case 'Labor Lc': yBase = laborY + textRowHeight / 2; labelClass = 'labor-label'; labelText = `Lc: ${event.details}`; break;
                    case 'Antibiotika Start': case 'Antibiotika Ende': return; default: return;
                }

                if (labelText) {
                     // Truncate long labels
                     if (labelText.length > maxLabelLength) {
                         labelText = labelText.substring(0, maxLabelLength - 1) + '…';
                     }

                     const posKey = `${Math.round(yBase)},${dateString}`;
                     const offsetIndex = textPositions[posKey] || 0;
                     const yOffset = offsetIndex * verticalTextOffset;
                     textPositions[posKey] = offsetIndex + 1;
                     const finalY = yBase + yOffset;

                    const label = document.createElementNS(SVG_NS, "text"); label.setAttribute('x', x + (markerSize / 2) + labelPadding); label.setAttribute('y', finalY); label.setAttribute('class', `timeline-text-label ${labelClass}`); label.textContent = labelText; chartGroup.appendChild(label);

                    // Draw connector line if offset
                    if (yOffset > 0) { const line = document.createElementNS(SVG_NS, "line"); line.setAttribute('x1', x); line.setAttribute('y1', yBase); line.setAttribute('x2', x + labelPadding - 2); line.setAttribute('y2', finalY); line.setAttribute('stroke', '#aaa'); line.setAttribute('stroke-width', 0.5); chartGroup.appendChild(line); }
                }
            });

        } catch (e) { console.error("Fehler beim Zeichnen der Timeline-Elemente:", e); }

    } // End of renderTimeline


     // --- Helper: Calculate Antibiotic Periods (Identical) ---
     function calculateAntibioticPeriods(allEvents) { /* ... */ const starts = allEvents.filter(e => e.type === 'Antibiotika Start' && e.date).map(e => ({...e, dateObj: new Date(e.date)})).filter(e => !isNaN(e.dateObj.getTime())).sort((a, b) => a.dateObj - b.dateObj); const ends = allEvents.filter(e => e.type === 'Antibiotika Ende' && e.date).map(e => ({...e, dateObj: new Date(e.date)})).filter(e => !isNaN(e.dateObj.getTime())).sort((a, b) => a.dateObj - b.dateObj); const periods = []; let usedEndIndices = new Set(); starts.forEach(start => { const startDrugName = start.details ? start.details.split(' ')[0].trim().toLowerCase() : null; let matchedEnd = null; const potentialEnds = ends.map((end, index) => ({ ...end, index })).filter(end => !usedEndIndices.has(end.index) && end.dateObj >= start.dateObj).sort((a, b) => { const dateDiff = a.dateObj - b.dateObj; if (dateDiff !== 0) return dateDiff; const aIsSpecific = a.details && startDrugName && a.details.toLowerCase().includes(startDrugName); const bIsSpecific = b.details && startDrugName && b.details.toLowerCase().includes(startDrugName); if (aIsSpecific && !bIsSpecific) return -1; if (!aIsSpecific && bIsSpecific) return 1; if (!a.details && b.details) return -1; if (a.details && !b.details) return 1; return 0; }); for (const end of potentialEnds) { const endDrugName = end.details ? end.details.split(' ')[0].trim().toLowerCase() : null; if (!endDrugName || (startDrugName && endDrugName === startDrugName) || !startDrugName) { matchedEnd = end; usedEndIndices.add(end.index); break; } } periods.push({ startDate: start.dateObj, endDate: matchedEnd ? matchedEnd.dateObj : null, details: start.details || '' }); }); return periods; }

    // --- Helper: Assign Antibiotic Rows (Identical) ---
    function assignAntibioticRows(periods) { /* ... */ const assignedPeriods = []; let maxRows = 0; periods.sort((a, b) => { const startDiff = a.startDate - b.startDate; if (startDiff !== 0) return startDiff; const endA = a.endDate ? a.endDate.getTime() : Infinity; const endB = b.endDate ? b.endDate.getTime() : Infinity; return endA - endB; }); const rowEnds = []; for (const period of periods) { let assignedRow = -1; for (let i = 0; i < rowEnds.length; i++) { if (period.startDate.getTime() > rowEnds[i]) { assignedRow = i; rowEnds[i] = period.endDate ? period.endDate.getTime() + (12*60*60*1000) : Infinity; /* Add 12hr gap */ break; } } if (assignedRow === -1) { assignedRow = rowEnds.length; rowEnds.push(period.endDate ? period.endDate.getTime() + (12*60*60*1000) : Infinity); } assignedPeriods.push({ ...period, row: assignedRow }); maxRows = Math.max(maxRows, assignedRow + 1); } return { assignedPeriods, maxRows }; }

    // --- Timeline Axis Helper Functions (REVISED calculateTickInterval) ---
    function calculateTickInterval(timeRangeMs, widthPx) {
        const targetTickWidth = 150; // INCREASED target width per tick significantly
        const maxTicks = Math.max(4, Math.floor(widthPx / targetTickWidth)); // Fewer max ticks for wider spacing
        const msPerDay = 86400000; const days = timeRangeMs / msPerDay;
        if (days <= 0) return { unit: 'day', step: 1 };
        // Prioritize clarity over density
        if (days <= maxTicks * 2) return { unit: 'day', step: 1 };
        if (days <= maxTicks * 5) return { unit: 'day', step: 2 };
        if (days <= maxTicks * 10) return { unit: 'day', step: 5 };
        if (days <= maxTicks * 15) return { unit: 'week', step: 1 };
        if (days <= maxTicks * 30) return { unit: 'week', step: 2 };
        if (days <= maxTicks * 70) return { unit: 'month', step: 1 };
        if (days <= maxTicks * 200) return { unit: 'month', step: 2 };
        if (days <= maxTicks * 400) return { unit: 'month', step: 3 };
        return { unit: 'month', step: 6 };
    }
    function getFirstTickDate(minDate, unit) { /* No changes */ const firstTick = new Date(minDate); firstTick.setUTCHours(0, 0, 0, 0); switch (unit) { case 'day': break; case 'week': const dayOfWeek = (firstTick.getUTCDay() + 6) % 7; if (dayOfWeek > 0) { firstTick.setUTCDate(firstTick.getUTCDate() + (7 - dayOfWeek));} if (firstTick < minDate) { firstTick.setUTCDate(firstTick.getUTCDate() + 7); } break; case 'month': firstTick.setUTCDate(1); if (firstTick < minDate) { firstTick.setUTCMonth(firstTick.getUTCMonth() + 1); } break; default: break; } while (firstTick < minDate) { if (unit === 'day') firstTick.setUTCDate(firstTick.getUTCDate() + 1); else if (unit === 'week') firstTick.setUTCDate(firstTick.getUTCDate() + 7); else if (unit === 'month') { firstTick.setUTCMonth(firstTick.getUTCMonth() + 1); firstTick.setUTCDate(1); } else break; } return firstTick; }
    function formatTickDate(date, unit) { /* No changes */ if (!(date instanceof Date) || isNaN(date.getTime())) return ''; try { if (unit === 'month' && date.getUTCDate() === 1) { return date.toLocaleDateString(lang, monthYearFormatOptions); } return date.toLocaleDateString(lang, dayMonthFormatOptions); } catch (e) { console.error("Error formatting tick date:", date, unit, e); return ''; } }


    // --- Clipboard Functions (No changes needed here) ---
    function copyPatientDataToClipboard() { /* ... */ const name = patientNameInput.value.trim() || 'N/A'; const dobFormatted = dateLocaleFormat(patientDobInput.value); const diagnosis = patientDiagnosisInput.value.trim() || 'N/A'; const team = patientTeamInput.value.trim() || 'N/A'; const infektio = infektioInvolviertCheckbox.checked ? 'Ja' : 'Nein'; const plwc = plwcInvolviertCheckbox.checked ? 'Ja' : 'Nein'; const orthoOption = orthoTeamSelect.options[orthoTeamSelect.selectedIndex]; const ortho = orthoOption ? orthoOption.text : 'N/A'; const text = `Patient: ${name}\nGeburtsdatum: ${dobFormatted}\nDiagnose: ${diagnosis}\nOrthopädie Team: ${ortho}\nZust. ext. Team/Arzt: ${team}\nInfektiologie involviert: ${infektio}\nPLWC involviert: ${plwc}`; const html = `<p><b>Patient:</b> ${escapeHtml(name)}<br><b>Geburtsdatum:</b> ${dobFormatted}<br><b>Diagnose:</b> ${escapeHtml(diagnosis).replace(/\n/g, '<br>')}<br><b>Orthopädie Team:</b> ${escapeHtml(ortho)}<br><b>Zust. ext. Team/Arzt:</b> ${escapeHtml(team)}<br><b>Infektiologie involviert:</b> ${infektio}<br><b>PLWC involviert:</b> ${plwc}</p>`; copyToClipboard(text, html, copyPatientDataButton); }
    function copySummaryToClipboard(listId, title, headers, buttonElement) { /* ... */ const listElement = document.getElementById(listId); if (!listElement || listElement.children.length === 0 || (listElement.children.length === 1 && listElement.firstElementChild.textContent.includes('Keine'))) { showCopyFeedback(buttonElement, 'Nichts zu kopieren', false); return; } let plainText = `${title}:\n`; let tableHtml = `<table class="clipboard-table"><caption>${escapeHtml(title)}</caption><thead><tr>`; headers.forEach(header => { tableHtml += `<th>${escapeHtml(header)}</th>`; }); tableHtml += `</tr></thead><tbody>`; Array.from(listElement.children).forEach(li => { const dateSpan = li.querySelector('.date'); const dateText = dateSpan ? dateSpan.textContent.replace(':', '').trim() : ''; const detailsText = (dateSpan ? li.textContent.replace(dateSpan.textContent, '') : li.textContent).trim(); if (listId === 'probeList') { const typeMatch = detailsText.match(/Art: (.*?)(?: - Keim:|$)/); const germMatch = detailsText.match(/Keim: (.*?)(?: \((.*)\)|$)/); const extraDetailsMatch = detailsText.match(/\((.*)\)$/); const probeType = typeMatch ? typeMatch[1].trim() : '?'; const probeGerm = germMatch ? germMatch[1].trim() : '?'; const probeExtra = extraDetailsMatch ? extraDetailsMatch[1].trim() : ''; plainText += `- ${dateText}: Art=${probeType}, Keim=${probeGerm}${probeExtra ? ', Details=' + probeExtra : ''}\n`; tableHtml += `<tr><td>${escapeHtml(dateText)}</td><td>${escapeHtml(probeType)}</td><td>${escapeHtml(probeGerm)}</td><td>${escapeHtml(probeExtra)}</td></tr>`; } else { plainText += `- ${dateText}: ${detailsText}\n`; tableHtml += `<tr><td>${escapeHtml(dateText)}</td><td>${escapeHtml(detailsText)}</td></tr>`; } }); tableHtml += `</tbody></table>`; copyToClipboard(plainText, tableHtml, buttonElement); }
    function copyToClipboard(plainText, htmlText, buttonElement) { /* ... */ if (!navigator.clipboard || !navigator.clipboard.write) { try { const textArea = document.createElement("textarea"); textArea.value = plainText; textArea.style.position = "fixed"; textArea.style.top = "0"; textArea.style.left = "0"; textArea.style.opacity = "0"; document.body.appendChild(textArea); textArea.focus(); textArea.select(); const successful = document.execCommand('copy'); document.body.removeChild(textArea); showCopyFeedback(buttonElement, successful ? 'Kopiert!' : 'Fehler (Fallback)', successful); } catch (err) { console.error('Fallback Copy Fehler: ', err); showCopyFeedback(buttonElement, 'Fehler', false); } return; } navigator.clipboard.write([ new ClipboardItem({ "text/plain": new Blob([plainText], { type: "text/plain" }), "text/html": new Blob([htmlText], { type: "text/html" }) }) ]).then(() => { showCopyFeedback(buttonElement, 'Kopiert!', true); }).catch(err => { console.error('Async Copy Fehler: ', err); navigator.clipboard.writeText(plainText).then(() => { showCopyFeedback(buttonElement, 'Kopiert (Text)!', true); }).catch(err2 => { console.error('Async Copy Text Fehler: ', err2); showCopyFeedback(buttonElement, 'Fehler', false); }); }); }
    function showCopyFeedback(buttonElement, message, success) { /* ... */ const originalText = buttonElement.textContent; buttonElement.textContent = message; buttonElement.disabled = true; buttonElement.style.backgroundColor = success ? '#2ecc71' : '#e74c3c'; setTimeout(() => { buttonElement.textContent = originalText; buttonElement.disabled = false; buttonElement.style.backgroundColor = ''; }, 1500); }
    function escapeHtml(unsafe) { /* ... */ if (unsafe === null || unsafe === undefined) return ''; return unsafe.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }

    // --- Initial Load ---
    loadData();
    handleEventTypeChange(); // Set initial state of conditional fields

}); // End DOMContentLoaded
