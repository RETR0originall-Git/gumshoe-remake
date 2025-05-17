let logins = [];

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'openManage') {
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

        // Sprawdź, czy rekord już istnieje
        const exists = logins.some(r =>
          r.host === record.host &&
          r.user === record.user &&
          r.pass === record.pass
        );

        if (!exists) {
          logins.push(record);
          chrome.storage.local.set({ logins: logins });
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

    // Zwracamy true, aby powiedzieć Chrome, że odpowiedź jest asynchroniczna
    return true;
  }
});

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.local.set({ passcode: 'gselog', logins: [] });
});

// Obsługa kliknięcia w ikonę rozszerzenia - otwórz manage.html w nowej karcie
chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.create({ url: chrome.runtime.getURL('html/manage.html') });
});
