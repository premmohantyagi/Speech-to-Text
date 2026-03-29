<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Speech to Text - Whisper</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <div class="container">
        <h1 class="app-title">Speech-to-Text</h1>

        <!-- Tab Navigation -->
        <div class="tab-nav">
            <button class="tab-btn active" data-tab="upload">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload Files
            </button>
            <button class="tab-btn" data-tab="dictation">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="1" width="6" height="11" rx="3"/>
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                Mic Recording
            </button>
        </div>

        <!-- Upload Tab -->
        <div class="tab-content active" id="tab-upload">
            <div class="upload-card">
                <div class="upload-header">
                    <h2>Upload Files</h2>
                    <span class="file-count" id="fileCount">0/4 files</span>
                </div>
                <div class="drop-zone" id="dropZone">
                    <div class="drop-zone-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 16V3"/>
                            <polyline points="16 7 12 3 8 7"/>
                            <path d="M20 16.7A4.5 4.5 0 0 0 17.5 8h-1.13A7 7 0 1 0 4 14.26"/>
                        </svg>
                        <p><strong>Drag &amp; drop</strong> or <a href="#" id="browseLink">browse</a></p>
                        <p class="file-types">MP3, MP4, WAV, WMA, OGG, M4A, DSS, DS2, WEBM, FLAC, AAC up to 170MB</p>
                    </div>
                    <input type="file" id="fileInput" multiple accept=".mp3,.mp4,.wav,.wma,.ogg,.m4a,.dss,.ds2,.webm,.flac,.aac" hidden>
                </div>
                <div class="file-list" id="fileList"></div>
                <button class="btn-primary" id="transcribeBtn" disabled>Transcribe</button>
            </div>
        </div>

        <!-- Dictation Tab -->
        <div class="tab-content" id="tab-dictation">
            <div class="dictation-card">
                <div class="mic-container">
                    <button class="mic-btn" id="micBtn">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                            <line x1="12" y1="19" x2="12" y2="23"/>
                            <line x1="8" y1="23" x2="16" y2="23"/>
                        </svg>
                    </button>
                    <p class="mic-label" id="micLabel">Click to start recording</p>
                </div>
                <canvas class="waveform" id="waveform" width="600" height="100"></canvas>
                <div class="timer" id="timer">00:00</div>
                <button class="btn-primary" id="stopTranscribeBtn" hidden>Stop & Transcribe</button>
            </div>
        </div>

        <!-- Processing Overlay -->
        <div class="processing-overlay" id="processingOverlay">
            <div class="spinner"></div>
            <p>Transcribing with Whisper...</p>
            <p class="processing-file" id="processingFileName"></p>
        </div>
    </div>

    <script src="assets/js/upload.js"></script>
    <script src="assets/js/dictation.js"></script>
</body>
</html>
