// Gumshoe original contributors: ajar (Aaron Artille) | 0xAether (Aaron) | ncnlinh (Linh Nguyen).
// Gumshoe remake (re-create) by: retr0originall.
// A Chromium extension for discreet password logging.

var timeout;
var passcode;

window.onload = function () {
    var refineTxt = document.getElementById('refineTxt');
    var deleteBtn = document.getElementById('deleteBtn');
    var passcodeBtn = document.getElementById('passcodeBtn');
    var lockerBtn = document.getElementById('lockerBtn');
    var counter = document.getElementById('counter');
    var recordList = document.getElementById('recordList');
    var logo = document.getElementById('logo');
    var plug = document.getElementById('plug');

    var lockScreen = document.getElementById('lockScreen');
    var unlockInput = document.getElementById('unlockInput');
    var unlockBtn = document.getElementById('unlockBtn');
    var unlockError = document.getElementById('unlockError');

    // Załaduj passcode i stan blokady
    chrome.storage.local.get(['passcode', 'locked'], function (response) {
        passcode = response.passcode || '';
        if (response.locked) {
            showLockScreen();
        } else {
            queryRecords();
        }
    });

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

    if (passcodeBtn) {
        passcodeBtn.addEventListener('click', function () {
            var p = prompt('Enter a passcode (minimum 4 characters):', passcode);
            if (p && p.length >= 4) {
                chrome.storage.local.set({ 'passcode': p }, function () {
                    passcode = p;
                    alert('Passcode changed to: ' + p);
                });
            } else if (p !== null) {
                alert('Passcode must be at least 4 characters.');
            }
        });
    }

    if (lockerBtn) {
        lockerBtn.addEventListener('click', function () {
            if (confirm('Are you sure you want to lock your data? You will need to enter the passcode to unlock.')) {
                chrome.storage.local.set({ locked: true }, function () {
                    showLockScreen();
                });
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

    if (unlockBtn && unlockInput) {
        unlockBtn.addEventListener('click', tryUnlock);
        unlockInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                tryUnlock();
            }
        });
    }

    function tryUnlock() {
        const attempt = unlockInput.value || '';
        if (attempt === passcode) {
            chrome.storage.local.set({ locked: false }, function () {
                hideLockScreen();
                queryRecords();
                unlockInput.value = '';
                unlockError.style.display = 'none';
            });
        } else {
            unlockError.style.display = 'block';
        }
    }

    function showLockScreen() {
        if (lockScreen) {
            lockScreen.style.display = 'block';
        }
        if (refineTxt) refineTxt.disabled = true;
        if (deleteBtn) deleteBtn.disabled = true;
        if (passcodeBtn) passcodeBtn.disabled = true;
        if (lockerBtn) lockerBtn.disabled = true;
        if (recordList) recordList.innerHTML = '';
        if (counter) counter.textContent = '0';
    }

    function hideLockScreen() {
        if (lockScreen) {
            lockScreen.style.display = 'none';
        }
        if (refineTxt) refineTxt.disabled = false;
        if (deleteBtn) deleteBtn.disabled = false;
        if (passcodeBtn) passcodeBtn.disabled = false;
        if (lockerBtn) lockerBtn.disabled = false;
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
                    '<p>' + escapeHtml(formatDateTime(row.time)) + '</p></li>';
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
        if (isPopup && text.length > 15) {
            return 'Too large data';
        }
        return escapeHtml(text);
    }

    function formatDateTime(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        if (isNaN(date)) return '';

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
};
