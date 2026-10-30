// The one setting: the BM Control Room Apps Script web app address.
// Apps Script -> Deploy -> Manage deployments -> Web app URL.
// It must end in /exec, and "Who has access" must be Anyone.
var BM_EXEC = 'https://script.google.com/macros/s/AKfycbwQECITTJrQuStQrbjzlmVsQ7lFt6gNuyEo0HRttCB3A037iHK6M0B7fibVaQ9G4LA9/exec';

if (/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(BM_EXEC)) {
  window.BM_EXEC_URL = BM_EXEC;
}
