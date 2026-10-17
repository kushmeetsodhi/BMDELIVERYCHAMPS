// The one setting: the Delivery Champs Apps Script web app address.
// Apps Script -> Deploy -> Manage deployments -> Web app URL.
// It must end in /exec, and "Who has access" must be Anyone.
var BM_EXEC = 'https://script.google.com/macros/s/AKfycbwCf4drmcMZWZqYLzUKuEeDxD6LxaVFxjMnmgu5sNZ_ueCUU2UBDW2W9_ZtiRpxpyOw/exec';

if (/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(BM_EXEC)) {
  window.BM_EXEC_URL = BM_EXEC;
}
