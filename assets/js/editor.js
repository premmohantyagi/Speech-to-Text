// editor.js — TinyMCE initialization, word-click audio sync, save, and export dropdown

(function () {
    'use strict';

    // 1. Initialize TinyMCE
    tinymce.init({
        selector: '#editor',
        toolbar: 'bold italic underline | formatselect | bullist numlist | alignleft aligncenter alignright | removeformat',
        plugins: 'lists',
        menubar: false,
        statusbar: false,
        height: '100%',
        content_style: `
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 15px; line-height: 1.8; padding: 16px; color: #1a1a2e; }
            .word { cursor: pointer; padding: 1px 0; border-radius: 2px; transition: background-color 0.2s ease; }
            .word:hover { background-color: rgba(108, 99, 255, 0.15); }
            .word.active { background-color: rgba(108, 99, 255, 0.3); border-bottom: 2px solid #6c63ff; }
        `,
        setup: function (editor) {
            // 2. Word click handler — seek audio to word start time
            editor.on('click', function (e) {
                var target = e.target;
                if (target.classList && target.classList.contains('word')) {
                    var start = parseFloat(target.getAttribute('data-start'));
                    if (!isNaN(start)) {
                        var audio = document.getElementById('audio');
                        audio.currentTime = start;
                        audio.play();
                    }
                }
            });
        }
    });

    // 3. Save button
    var saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function () {
            var content = tinymce.activeEditor.getContent();
            var originalText = saveBtn.textContent;

            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';

            fetch('api/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: TRANSCRIPTION_ID,
                    content: content
                })
            })
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                saveBtn.textContent = 'Saved!';
                setTimeout(function () {
                    saveBtn.textContent = originalText;
                    saveBtn.disabled = false;
                }, 1500);
            })
            .catch(function (err) {
                console.error('Save failed:', err);
                saveBtn.textContent = 'Error!';
                setTimeout(function () {
                    saveBtn.textContent = originalText;
                    saveBtn.disabled = false;
                }, 2000);
            });
        });
    }

    // 4. Export dropdown toggle
    var exportBtn = document.querySelector('.btn-export');
    var exportMenu = document.querySelector('.export-menu');

    if (exportBtn && exportMenu) {
        exportBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            exportMenu.classList.toggle('open');
        });

        // Close on outside click
        document.addEventListener('click', function (e) {
            if (!exportBtn.contains(e.target) && !exportMenu.contains(e.target)) {
                exportMenu.classList.remove('open');
            }
        });
    }

})();
