// The one setting: the Delivery Champs Apps Script web app address.
// Apps Script -> Deploy -> Manage deployments -> Web app URL.
// It must end in /exec, and "Who has access" must be Anyone.
var BM_EXEC = 'https://script.google.com/macros/s/AKfycbwCf4drmcMZWZqYLzUKuEeDxD6LxaVFxjMnmgu5sNZ_ueCUU2UBDW2W9_ZtiRpxpyOw/exec';


// Live location for the Control Room map. true = on, false = off.
// Changing only this line and committing is enough: phones pick it
// up the next time the app is opened.
window.BM_TRACK_LOCATION = false;

// Selfie check-in at the warehouse, first login of the day.
// true = on, false = off. Needs the matching Apps Script files.
window.BM_SELFIE_LOGIN = false;

if (/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(BM_EXEC)) {
  window.BM_EXEC_URL = BM_EXEC;
}
