let logins = [];

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'openManage') {
    console.log('[background] openManage message received, opening manage.html');
    chrome.tabs.create({ url: chrome.runtime.getURL('html/manage.html') });
    return;
  }

  if (request.action === 'queryDatabase') {
    chrome.storage.local.get(['logins'], function (result) {
      logins = result.logins || [];

      if (request.crud === 'create') {
        const record = {
          time: new Date().toISOString(),
          href: request.record[0],
          host: request.record[1],
          user: request.record[2],
          pass: request.record[3]
        };

        const exists = logins.some(r =>
          r.host === record.host &&
          r.user === record.user &&
          r.pass === record.pass
        );

        if (!exists) {
          logins.push(record);
          chrome.storage.local.set({ logins: logins }, () => {
            if (chrome.runtime.lastError) {
              console.error('[background] Error saving logs:', chrome.runtime.lastError.message);
            }
          });
        }

        sendResponse({ success: true });
      }
      else if (request.crud === 'read') {
        const refine = (request.refine || '').toLowerCase();
        const filtered = logins.filter(entry =>
          entry.host.toLowerCase().includes(refine) ||
          entry.user.toLowerCase().includes(refine) ||
          entry.pass.toLowerCase().includes(refine) ||
          entry.time.toLowerCase().includes(refine)
        );
        sendResponse(filtered);
      }
      else if (request.crud === 'delete') {
        const refine = (request.refine || '').toLowerCase();
        logins = logins.filter(entry =>
          !(
            entry.host.toLowerCase().includes(refine) ||
            entry.user.toLowerCase().includes(refine) ||
            entry.pass.toLowerCase().includes(refine) ||
            entry.time.toLowerCase().includes(refine)
          )
        );
        chrome.storage.local.set({ logins: logins });
        sendResponse([]);
      }
    });

    return true; 
  }
});

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.local.set({ passcode: 'GSELOG', logins: [] });
  console.log('[background] Extension installed, set default passcode to GSELOG');
});

chrome.action.onClicked.addListener(function(tab) {
  chrome.tabs.create({ url: chrome.runtime.getURL('html/manage.html') });
});
