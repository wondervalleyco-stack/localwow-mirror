// ==================================================================
// ==================================================================
// RENDER THE MAIN TAB (ראשי) — WOW2
// ==================================================================
// ==================================================================
function renderMainTabForHost_wow2(ui) {
  const idx  = (window.EditElementObject && window.EditElementObject.ElementIndex) ?? -1;
  const row  = (idx >= 0 && window.MyElementLibrary && window.MyElementLibrary[idx]) ? window.MyElementLibrary[idx] : {};



  // values from the element row (null/undefined → "")
  const max_participants   = nz(row.max_participants);
  const min_participants   = nz(row.min_participants);
  const over_min_percent   = nz(row.over_min_percent);
  const min_time_slots     = nz(row.min_time_slots);
  const duration_minutes   = row.duration_minutes ?? null;     // number or null
  const location_text      = nz(row.location_text);

  const hhmm = minutesToHHMM(duration_minutes); // "H:MM" or ""

  ui.panel.innerHTML =
    '<section class="wow2-section">' +
      '<div class="wow2-sub-h">ראשי</div>' +

      // 1) MAX PARTICIPANTS
      '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
        renderNumberInput_wow2({ id:'max_participants', label:'מקסימום משתתפים בחלון זמן אחד:', required:true, value:max_participants, min:0, step:1 }) +
        renderInfoBox_wow2('המספר קובע את מספר המשתתפים שאפשר לשלוח בחלון זמן אחד. המספר קשור למקסימום הקיבולת הפיזית של הלוקיישן או המארח. המספר קובע כמות משתתפים בפועל בלי קשר האם הפריטים זוג או קבוצה.') +
        '<div class="wow2-note">• לא ניתן לשינוי אחרי האקטיבציה</div>' +
      '</div>' +

      // 2) MIN PARTICIPANTS
      '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
        renderNumberInput_wow2({ id:'min_participants', label:'מינימום משתתפים בחלון זמן אחד:', required:true, value:min_participants, min:0, step:1 }) +
        renderInfoBox_wow2('המספר קובע כמה מינימום משתתפים חייבים להירשם לכל חלון זמן כדי שאפשר יהיה לקיים את האירוע. שימו לב: מספר זה יקבע מתי חלון זמן הופך ל״סליקה״ ואפשר להצעות לעבור ממצב מוקפא/טיוטה למצב הצלחה.') +
        '<div class="wow2-note">• ניתן לשינוי אחרי האקטיבציה</div>' +
      '</div>' +

      // 3) OVER MIN PERCENT
      '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
        renderNumberInput_wow2({ id:'over_min_percent', label:'אחוז הרשמה מעבר למינימום:', required:false, value:over_min_percent, min:0, max:100, step:1, suffix:"%" }) +
        renderInfoBox_wow2('אחוז זה מגבה מרווח תפעולי על חלון זמן שהגיע לסליקה — ההמלצה היא לפחות 10%.') +
      '</div>' +

      // 4) MIN TIME SLOTS
      '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
        renderNumberInput_wow2({ id:'min_time_slots', label:'מינימום חלונות הזמן בהצעה:', required:false, value:min_time_slots, min:0, step:1 }) +
        renderInfoBox_wow2('המספר מאפשר ליוצר האלמנט לקבוע כמה חלונות זמן מינימליים שהצעה שמכילה אותו צריכה למכור על מנת שאירוע יצא לפועל.') +
      '</div>' +

      // 5) DURATION (HH:MM)
      '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
        renderDurationInput_wow2({ id:'duration_hhmm', label:'משך חלון זמן אחד:', required:false, valueHHMM: hhmm }) +
        renderInfoBox_wow2('זמן זה קובע את משך החלון מפתיחת הדלתות ועד סיום החוויה. שימו לב — האלמנט האחראי קובע את המשך של חלון הזמן/אורך האירוע עבור כל המשתתפים הנופלים באותו חלון תאריך/שעה.') +
      '</div>' +

      // 6) LOCATION TEXT
      '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
        renderFlexFormInput_wow2({ id:'location_text', label:'מיקום ההפקה:', required:false, value:location_text, placeholder:"רחוב הפרדס 3 - פרדס חנה - כרכור" }) +
        renderInfoBox_wow2('טקסט חופשי של כתובת/מיקום. טיפ: השדה הזה מוצג למשתתפים בשלב מאוחר יותר או רק למי שנרשם — לפי הגדרות האלמנט.') +
      '</div>' +

    '</section>';
}


// =====================================================================
// MAIN TAB — SERVICE
// =====================================================================
function renderMainTabForService_wow2(ui) {
  const idx = (window.EditElementObject && window.EditElementObject.ElementIndex) ?? -1;
  const row = (idx >= 0 && window.MyElementLibrary && window.MyElementLibrary[idx]) ? window.MyElementLibrary[idx] : {};

  const max_per_hour               = nz(row.max_per_hour);
  const min_participants_threshold = nz(row.min_participants_threshold);

  ui.panel.innerHTML =
    '<section class="wow2-section">' +
      '<div class="wow2-sub-h">ראשי</div>' +

      // MAX PER HOUR
      '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
        renderNumberInput_wow2({ id: 'max_per_hour', label: 'מקסימום משתתפים בשעה:', required: true, value: max_per_hour, min: 0, step: 1 }) +
        renderInfoBox_wow2('זה קצב שיגרתי שהאלמנט מסוגל לספק – כלומר כמה לקוחות ניתן לשלח בשעה בקצב מקסימום. נתון זה מאפשר למערכת לחשב האם הוא יכול לעמוד בלקוחות/לספק את כל האירוחים של האירוע בזמן שבין פתיחת הדלתות ועד סיום האירוע, ואם יש צורך להגדיל את נפח השירות או להוסיף זמן ומופעים נוספים.') +
        '<div class="wow2-note">• ניתן לשינוי אחרי האקטיבציה</div>' +
      '</div>' +

      // MIN PARTICIPANTS THRESHOLD
      '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
        renderNumberInput_wow2({ id: 'min_participants_threshold', label: 'מינימום משתתפים:', required: true, value: min_participants_threshold, min: 0, step: 1 }) +
        renderInfoBox_wow2('זו כמות משתתפים מינימלית שנדרשת כדי שהאירוע יוגדר כ״סליקה״. ניתן להשאיר רק אם אין הגבלה (כמו במתכונת מוצג אומנות).') +
        '<div class="wow2-note">• ניתן לשינוי אחרי האקטיבציה</div>' +
      '</div>' +

    '</section>';
}


// =====================================================================
// MAIN TAB — PRODUCTION
// =====================================================================
function renderMainTabForProduction_wow2(ui) {
  const idx = (window.EditElementObject && window.EditElementObject.ElementIndex) ?? -1;
  const row = (idx >= 0 && window.MyElementLibrary && window.MyElementLibrary[idx]) ? window.MyElementLibrary[idx] : {};

  const price_per_time_slot = nz(row.price_per_time_slot);
  const max_participants    = nz(row.max_participants);
  const min_time_slots      = nz(row.min_time_slots);

  ui.panel.innerHTML =
    '<section class="wow2-section">' +
      '<div class="wow2-sub-h">ראשי</div>' +

      // PRICE PER TIME SLOT
      '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
        renderNumberInput_wow2({ id: 'price_per_time_slot', label: 'מחיר לחלון זמן אחד(₪):', required: true, value: price_per_time_slot, min: 0, step: 1 }) +
        renderInfoBox_wow2('המחיר הנקוב מאפשר לקבוע עבור האלמנט מחיר קבוע לחלון זמן אחד – מספר זה יילקח בחשבון בתמחור משתתפים ויוצג בעת הרכישה על פי חישוב של הסכום לחלוקת המשתתפים המשתייכים לאותו חלון זמן. ניתן לקבוע מחיר חלון זמן על בסיס זמן משוער למיקסום.') +
        '<div class="wow2-note">• ניתן לשינוי אחרי האקטיבציה</div>' +
      '</div>' +

      // MAX PARTICIPANTS
      '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
        renderNumberInput_wow2({ id: 'max_participants', label: 'מקסימום משתתפים באירוע:', required: true, value: max_participants, min: 0, step: 1 }) +
        renderInfoBox_wow2('מגדירה גודל מרבי לאירוע. ניתן להשאיר רק אם אין הגבלה (כמו במתכונת מוצג אומנות).') +
        '<div class="wow2-note">• ניתן לשינוי אחרי האקטיבציה</div>' +
      '</div>' +

      // MIN TIME SLOTS
      '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
        renderNumberInput_wow2({ id: 'min_time_slots', label: 'מינימום חלונות זמן:', required: false, value: min_time_slots, min: 0, step: 1 }) +
        renderInfoBox_wow2('מינימום חלונות זמן שיוצר נדרש להתחייב כדי להבטיח יצוא האלמנט על פני סבבי השתתפות.') +
        '<div class="wow2-note">• ניתן לשינוי אחרי האקטיבציה</div>' +
      '</div>' +

    '</section>';
}



// -----------------------
// HELPER FUNCTIONS (tiny)
// -----------------------
function nz(v, def='') { return (v === null || v === undefined) ? def : String(v); }

// Minutes → "H:MM" (e.g., 120 → "2:00"), null/"" → ""
function minutesToHHMM(mins) {
  if (mins === null || mins === undefined || mins === '') return '';
  const m = Math.max(0, parseInt(mins, 10));
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  return `${h}:${mm}`;
}

// "H:MM" → total minutes (e.g., "1:30" → 90), invalid → null
function hhmmToMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return null;
  const m = hhmm.trim().match(/^(\d{1,3}):([0-5]\d)$/);
  if (!m) return null;
  return parseInt(m[1],10) * 60 + parseInt(m[2],10);
}

// Number strip (same visual as text, just type=number + min/max/step)
function renderNumberInput_wow2({ id, label, required=false, value='', min=null, max=null, step=1, suffix='' }) {
  const req = required ? '<span class="wow2-req">★</span>' : '';
  const minAttr  = (min !== null && min !== undefined) ? ` min="${min}"` : '';
  const maxAttr  = (max !== null && max !== undefined) ? ` max="${max}"` : '';
  const stepAttr = (step !== null && step !== undefined) ? ` step="${step}"` : '';
  const suffixHTML = suffix ? `<span class="wow2-note" style="margin-inline-start:6px">${suffix}</span>` : '';

  return (
    '<div class="wow2-flexrow">' +
      `<label class="wow2-formlabel" for="${id}">${req}<span>${label}</span></label>` +
      '<div class="wow2-formcontrol">' +
        `<div class="wow2-input" style="display:flex;align-items:center;">` +
          `<input id="${id}" type="number" class="wow2-input" style="background:transparent;border:0;flex:1" value="${value}"${minAttr}${maxAttr}${stepAttr}>` +
          suffixHTML +
        `</div>` +
      '</div>' +
    '</div>'
  );
}

// HH:MM strip (duration)
function renderDurationInput_wow2({ id, label, required=false, valueHHMM='' }) {
  const req = required ? '<span class="wow2-req">★</span>' : '';
  // We keep a single text input with pattern "H:MM" to stay on our styled wow2-input.
  return (
    '<div class="wow2-flexrow">' +
      `<label class="wow2-formlabel" for="${id}">${req}<span>${label}</span></label>` +
      '<div class="wow2-formcontrol">' +
        `<input id="${id}" class="wow2-input" type="text" inputmode="numeric" placeholder="שעות:דקות" value="${valueHHMM}" pattern="^\\d{1,3}:[0-5]\\d$" title="הקלד שעות:דקות (לדוגמה 2:00)">` +
      '</div>' +
    '</div>'
  );
}
