// The one setting: the BM Warehouse Apps Script web app address.
// It is printed on the summary page of the "Create Warehouse project" run
// (bm-apps-script -> Actions). It must end in /exec.
var BM_EXEC = '';

if (/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(BM_EXEC)) {
  window.BM_EXEC_URL = BM_EXEC;
}
