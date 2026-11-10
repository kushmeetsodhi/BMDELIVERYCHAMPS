// The one setting: the BM Inventory Ageing Apps Script web app address.
// Apps Script -> Deploy -> Manage deployments -> Web app URL.
// It must end in /exec, and "Who has access" must be Anyone.
var BM_EXEC = 'https://script.google.com/macros/s/AKfycbyTJqEzI38eS3nItZDvcof6M7lYezbBw0nd2ojBuXPSdyxwAOmoodz_G7GgjdZyc_Bk/exec';

if (/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(BM_EXEC)) {
  window.BM_EXEC_URL = BM_EXEC;
}
