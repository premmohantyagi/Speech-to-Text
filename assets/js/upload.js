(function () {
    'use strict';

    // ── Constants ──────────────────────────────────────────────
    const MAX_FILES = 4;
    const MAX_SIZE = 170 * 1024 * 1024; // 170 MB
    const ALLOWED_EXTENSIONS = [
        'mp3', 'mp4', 'wav', 'wma', 'ogg', 'm4a',
        'dss', 'ds2', 'webm', 'flac', 'aac'
    ];

    // ── State ──────────────────────────────────────────────────
    let selectedFiles = [];

    // ── DOM refs ───────────────────────────────────────────────
    const tabBtns          = document.querySelectorAll('.tab-btn');
    const tabContents      = document.querySelectorAll('.tab-content');
    const dropZone         = document.getElementById('dropZone');
    const fileInput        = document.getElementById('fileInput');
    const browseLink       = document.getElementById('browseLink');
    const fileList         = document.getElementById('fileList');
    const fileCount        = document.getElementById('fileCount');
    const transcribeBtn    = document.getElementById('transcribeBtn');
    const processingOverlay = document.getElementById('processingOverlay');
    const processingFileName = document.getElementById('processingFileName');

    // ── 1. Tab Switching ───────────────────────────────────────
    tabBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var tab = btn.getAttribute('data-tab');

            tabBtns.forEach(function (b) { b.classList.remove('active'); });
            tabContents.forEach(function (c) { c.classList.remove('active'); });

            btn.classList.add('active');
            document.getElementById('tab-' + tab).classList.add('active');
        });
    });

    // ── 2. Drag & Drop ────────────────────────────────────────
    ['dragenter', 'dragover'].forEach(function (evt) {
        dropZone.addEventListener(evt, function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(function (evt) {
        dropZone.addEventListener(evt, function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
        });
    });

    dropZone.addEventListener('drop', function (e) {
        var files = e.dataTransfer.files;
        handleFiles(files);
    });

    // ── 3. Browse Click ────────────────────────────────────────
    browseLink.addEventListener('click', function (e) {
        e.preventDefault();
        fileInput.click();
    });

    fileInput.addEventListener('change', function () {
        handleFiles(fileInput.files);
        fileInput.value = '';
    });

    // ── 4. File Validation & Handling ──────────────────────────
    function getExtension(filename) {
        var parts = filename.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : '';
    }

    function handleFiles(fileListObj) {
        for (var i = 0; i < fileListObj.length; i++) {
            var file = fileListObj[i];

            if (selectedFiles.length >= MAX_FILES) {
                alert('Maximum ' + MAX_FILES + ' files allowed.');
                break;
            }

            var ext = getExtension(file.name);
            if (ALLOWED_EXTENSIONS.indexOf(ext) === -1) {
                alert('File type ".' + ext + '" is not supported.\nAllowed: ' + ALLOWED_EXTENSIONS.join(', '));
                continue;
            }

            if (file.size > MAX_SIZE) {
                alert('"' + file.name + '" exceeds the 170 MB limit.');
                continue;
            }

            // Prevent duplicate file names
            var duplicate = selectedFiles.some(function (f) {
                return f.name === file.name && f.size === file.size;
            });
            if (duplicate) continue;

            selectedFiles.push(file);
        }

        renderFileList();
    }

    // ── 5. File List Rendering ─────────────────────────────────
    function renderFileList() {
        fileList.innerHTML = '';

        selectedFiles.forEach(function (file, index) {
            var row = document.createElement('div');
            row.className = 'file-item';

            row.innerHTML =
                '<div class="file-info">' +
                    '<svg class="file-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                        '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
                        '<polyline points="14 2 14 8 20 8"/>' +
                    '</svg>' +
                    '<span class="file-name">' + escapeHtml(file.name) + '</span>' +
                    '<span class="file-size">' + formatFileSize(file.size) + '</span>' +
                '</div>' +
                '<button class="file-remove" data-index="' + index + '" title="Remove file">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                        '<line x1="18" y1="6" x2="6" y2="18"/>' +
                        '<line x1="6" y1="6" x2="18" y2="18"/>' +
                    '</svg>' +
                '</button>';

            // Progress bar container (hidden until upload starts)
            var progress = document.createElement('div');
            progress.className = 'file-progress';
            progress.id = 'progress-' + index;
            progress.style.display = 'none';
            progress.innerHTML = '<div class="file-progress-bar" style="width:0%"></div>';
            row.appendChild(progress);

            fileList.appendChild(row);
        });

        // Bind remove buttons
        document.querySelectorAll('.file-remove').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = parseInt(btn.getAttribute('data-index'), 10);
                selectedFiles.splice(idx, 1);
                renderFileList();
            });
        });

        // Update count and button state
        fileCount.textContent = selectedFiles.length + '/' + MAX_FILES + ' files';
        transcribeBtn.disabled = selectedFiles.length === 0;
    }

    // ── 6. Transcribe Button ───────────────────────────────────
    transcribeBtn.addEventListener('click', function () {
        if (selectedFiles.length === 0) return;
        startUpload();
    });

    // ── 7. Upload Flow ─────────────────────────────────────────
    function startUpload() {
        transcribeBtn.disabled = true;
        transcribeBtn.textContent = 'Uploading...';

        var formData = new FormData();
        selectedFiles.forEach(function (file) {
            formData.append('files[]', file);
        });

        var xhr = new XMLHttpRequest();

        // Show per-file progress bars
        selectedFiles.forEach(function (_f, i) {
            var prog = document.getElementById('progress-' + i);
            if (prog) prog.style.display = 'block';
        });

        xhr.upload.addEventListener('progress', function (e) {
            if (!e.lengthComputable) return;
            var pct = Math.round((e.loaded / e.total) * 100);
            // Distribute progress evenly across file bars
            selectedFiles.forEach(function (_f, i) {
                var bar = document.querySelector('#progress-' + i + ' .file-progress-bar');
                if (bar) bar.style.width = pct + '%';
            });
        });

        xhr.addEventListener('load', function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                var response;
                try {
                    response = JSON.parse(xhr.responseText);
                } catch (err) {
                    alert('Invalid response from server.');
                    resetButton();
                    return;
                }

                if (response.error) {
                    alert('Upload error: ' + response.error);
                    resetButton();
                    return;
                }

                var sessionId = response.session_id;
                var filePaths = response.files || [];

                // Transcribe the first file and redirect
                if (filePaths.length > 0) {
                    transcribeFile(filePaths[0].path, sessionId);
                }
            } else {
                alert('Upload failed (HTTP ' + xhr.status + ').');
                resetButton();
            }
        });

        xhr.addEventListener('error', function () {
            alert('Network error during upload.');
            resetButton();
        });

        xhr.open('POST', 'api/upload.php', true);
        xhr.send(formData);
    }

    function transcribeFile(filePath, sessionId) {
        processingOverlay.classList.add('active');
        processingFileName.textContent = filePath.split('/').pop();

        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'api/transcribe.php', true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.addEventListener('load', function () {
            processingOverlay.classList.remove('active');

            if (xhr.status >= 200 && xhr.status < 300) {
                var res;
                try {
                    res = JSON.parse(xhr.responseText);
                } catch (err) {
                    alert('Invalid transcription response.');
                    resetButton();
                    return;
                }

                if (res.error) {
                    alert('Transcription error: ' + res.error);
                    resetButton();
                    return;
                }

                var transcriptionId = res.transcription_id || res.id;
                if (transcriptionId) {
                    window.location.href = 'editor.php?id=' + encodeURIComponent(transcriptionId);
                } else {
                    alert('Transcription completed but no ID returned.');
                    resetButton();
                }
            } else {
                alert('Transcription failed (HTTP ' + xhr.status + ').');
                resetButton();
            }
        });

        xhr.addEventListener('error', function () {
            processingOverlay.classList.remove('active');
            alert('Network error during transcription.');
            resetButton();
        });

        xhr.send(JSON.stringify({
            file_path: filePath,
            session_id: sessionId
        }));
    }

    function resetButton() {
        transcribeBtn.disabled = selectedFiles.length === 0;
        transcribeBtn.textContent = 'Transcribe';
    }

    // ── 8. Helpers ─────────────────────────────────────────────
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

})();
