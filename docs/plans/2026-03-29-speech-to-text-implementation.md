# Speech-to-Text (Whisper) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a web app that transcribes audio via OpenAI Whisper (local, free) with a rich text editor and synced audio player for reviewing transcriptions.

**Architecture:** PHP backend on WAMP calls Python's openai-whisper via shell_exec() for transcription with word-level timestamps. Frontend uses TinyMCE for editing, custom HTML5 audio player with two-way word-level sync. Export via PhpWord (DOCX) and DomPDF (PDF).

**Tech Stack:** PHP 7+, Python 3, openai-whisper, TinyMCE (CDN), vanilla JS, PhpWord, DomPDF

---

### Task 1: Project Scaffolding & Dependencies

**Files:**
- Create: `composer.json`
- Create: `uploads/.gitkeep`
- Create: `transcriptions/.gitkeep`
- Create: `python/transcribe.py` (empty placeholder)
- Create: `api/` directory structure

**Step 1: Create directory structure**

```bash
cd c:/wamp64/www/Speech-to-Text
mkdir -p api assets/css assets/js assets/img uploads transcriptions python
touch uploads/.gitkeep transcriptions/.gitkeep
```

**Step 2: Create composer.json**

```json
{
    "name": "speech-to-text/app",
    "description": "Speech to Text using OpenAI Whisper",
    "require": {
        "phpoffice/phpword": "^1.1",
        "dompdf/dompdf": "^2.0"
    }
}
```

**Step 3: Install PHP dependencies**

Run: `composer install`
Expected: vendor/ directory created with phpword and dompdf

**Step 4: Verify Python whisper is installed**

Run: `python -c "import whisper; print(whisper.__version__)"`
Expected: Version number printed. If not installed, run `pip install openai-whisper`

**Step 5: Verify ffmpeg is installed**

Run: `ffmpeg -version`
Expected: Version info printed. If not, install ffmpeg and add to PATH.

**Step 6: Commit**

```bash
git add composer.json composer.lock uploads/.gitkeep transcriptions/.gitkeep
git commit -m "chore: scaffold project structure and install dependencies"
```

---

### Task 2: Python Transcription Script

**Files:**
- Create: `python/transcribe.py`

**Step 1: Write the transcription script**

```python
import sys
import json
import whisper

def transcribe(file_path, model_name="base"):
    model = whisper.load_model(model_name)
    result = model.transcribe(file_path, word_timestamps=True)

    output = {
        "text": result["text"],
        "language": result.get("language", ""),
        "segments": []
    }

    for segment in result["segments"]:
        seg_data = {
            "id": segment["id"],
            "start": segment["start"],
            "end": segment["end"],
            "text": segment["text"],
            "words": []
        }
        if "words" in segment:
            for word_info in segment["words"]:
                seg_data["words"].append({
                    "word": word_info["word"],
                    "start": round(word_info["start"], 3),
                    "end": round(word_info["end"], 3)
                })
        output["segments"].append(seg_data)

    return output

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)

    file_path = sys.argv[1]
    model_name = sys.argv[2] if len(sys.argv) > 2 else "base"

    try:
        result = transcribe(file_path, model_name)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
```

**Step 2: Test with a sample audio file**

Run: `python python/transcribe.py path/to/sample.mp3`
Expected: JSON output with text, segments, and word-level timestamps

**Step 3: Commit**

```bash
git add python/transcribe.py
git commit -m "feat: add Whisper transcription script with word-level timestamps"
```

---

### Task 3: CSS Stylesheet

**Files:**
- Create: `assets/css/style.css`

**Step 1: Write the full stylesheet**

This is a large file. Key sections:
- CSS reset and variables (colors: primary `#4338ca`, background `#f8f9fa`)
- Tab navigation (active tab = filled primary, inactive = outline)
- Upload zone (dashed border, hover state, drag-over highlight)
- File list with progress bars
- Dictation page (mic button, waveform, timer)
- Editor page layout (header, TinyMCE container, fixed bottom player)
- Audio player bar (dark bg, controls layout, seek bar, speed buttons)
- Word highlight class `.word.active { background: #fef08a; }` for sync
- Responsive design for smaller screens
- Processing/loading spinner

**Step 2: Commit**

```bash
git add assets/css/style.css
git commit -m "feat: add complete stylesheet for upload, dictation, and editor pages"
```

---

### Task 4: Home Page — Upload Files Tab (`index.php`)

**Files:**
- Create: `index.php`
- Create: `assets/js/upload.js`

**Step 1: Write index.php**

```php
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
        <p class="app-subtitle">Powered by Whisper — OpenAI</p>

        <!-- Tab Navigation -->
        <div class="tab-nav">
            <button class="tab-btn active" data-tab="upload">
                <svg><!-- upload icon --></svg> Upload Files
            </button>
            <button class="tab-btn" data-tab="dictation">
                <svg><!-- mic icon --></svg> Mic Recording
            </button>
        </div>

        <!-- Upload Tab -->
        <div class="tab-content active" id="tab-upload">
            <div class="upload-card">
                <div class="upload-header">
                    <h2>Upload Files</h2>
                    <span class="file-count">0/4 files</span>
                </div>
                <div class="drop-zone" id="dropZone">
                    <div class="drop-zone-content">
                        <svg class="cloud-icon"><!-- cloud upload icon --></svg>
                        <p><strong>Drag & drop</strong> or <a href="#" id="browseLink">browse</a></p>
                        <p class="file-types">DOC, DOCX, PDF, MP3, MP4, WAV, WMA, OGG, M4A, DSS, DS2, ZIP up to 170MB</p>
                    </div>
                    <input type="file" id="fileInput" multiple accept=".doc,.docx,.pdf,.mp3,.mp4,.wav,.wma,.ogg,.m4a,.dss,.ds2,.zip" hidden>
                </div>
                <div class="file-list" id="fileList"></div>
                <button class="btn-primary" id="transcribeBtn" disabled>Transcribe</button>
            </div>
        </div>

        <!-- Dictation Tab -->
        <div class="tab-content" id="tab-dictation">
            <!-- Filled in Task 6 -->
        </div>

        <!-- Processing Overlay -->
        <div class="processing-overlay" id="processingOverlay" hidden>
            <div class="spinner"></div>
            <p>Transcribing with Whisper...</p>
            <p class="processing-file" id="processingFileName"></p>
        </div>
    </div>

    <script src="assets/js/upload.js"></script>
</body>
</html>
```

**Step 2: Write upload.js**

Key functionality:
- Tab switching (add/remove `active` class on `.tab-btn` and `.tab-content`)
- Drag & drop handlers on `#dropZone` (dragenter, dragover, dragleave, drop)
- File input change handler via `#browseLink` click
- File validation: max 4 files, max 170MB each, allowed extensions only
- Render file list with name, size, remove button, progress bar
- `#transcribeBtn` enabled when files.length > 0
- On transcribe click: upload files via `FormData` + `XMLHttpRequest` to `api/upload.php`
- Show progress per file via `xhr.upload.onprogress`
- On upload complete: call `api/transcribe.php` with file paths
- Show processing overlay during transcription
- On transcription complete: redirect to `editor.php?id={transcription_id}`

**Step 3: Test manually**

Open `http://localhost/Speech-to-Text/` in browser.
Expected: Upload tab visible, drag & drop works, browse opens file picker, file list renders.

**Step 4: Commit**

```bash
git add index.php assets/js/upload.js
git commit -m "feat: add home page with file upload tab and drag-drop UI"
```

---

### Task 5: Upload & Transcribe API

**Files:**
- Create: `api/upload.php`
- Create: `api/transcribe.php`

**Step 1: Write api/upload.php**

```php
<?php
header('Content-Type: application/json');

$uploadDir = __DIR__ . '/../uploads/';
$allowedExt = ['doc','docx','pdf','mp3','mp4','wav','wma','ogg','m4a','dss','ds2','zip'];
$maxSize = 170 * 1024 * 1024; // 170MB
$maxFiles = 4;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

if (empty($_FILES['files'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No files uploaded']);
    exit;
}

$files = $_FILES['files'];
$fileCount = is_array($files['name']) ? count($files['name']) : 1;

if ($fileCount > $maxFiles) {
    http_response_code(400);
    echo json_encode(['error' => "Maximum $maxFiles files allowed"]);
    exit;
}

// Create unique session directory
$sessionId = uniqid('sess_', true);
$sessionDir = $uploadDir . $sessionId . '/';
mkdir($sessionDir, 0755, true);

$uploaded = [];

for ($i = 0; $i < $fileCount; $i++) {
    $name = $files['name'][$i];
    $tmpName = $files['tmp_name'][$i];
    $size = $files['size'][$i];
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));

    if (!in_array($ext, $allowedExt)) {
        continue; // skip invalid
    }
    if ($size > $maxSize) {
        continue; // skip oversized
    }

    $safeName = $sessionId . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $name);
    $destPath = $sessionDir . $safeName;

    if (move_uploaded_file($tmpName, $destPath)) {
        $uploaded[] = [
            'name' => $name,
            'path' => $destPath,
            'size' => $size
        ];
    }
}

echo json_encode([
    'session_id' => $sessionId,
    'files' => $uploaded
]);
```

**Step 2: Write api/transcribe.php**

```php
<?php
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$filePath = $input['file_path'] ?? '';
$sessionId = $input['session_id'] ?? '';

if (!$filePath || !file_exists($filePath)) {
    http_response_code(400);
    echo json_encode(['error' => 'File not found']);
    exit;
}

// Call Python whisper script
$pythonPath = 'python'; // adjust if needed
$scriptPath = __DIR__ . '/../python/transcribe.py';
$escapedFile = escapeshellarg($filePath);
$command = "$pythonPath $scriptPath $escapedFile 2>&1";

$output = shell_exec($command);
$result = json_decode($output, true);

if (!$result || isset($result['error'])) {
    http_response_code(500);
    echo json_encode(['error' => $result['error'] ?? 'Transcription failed']);
    exit;
}

// Save transcription JSON
$transDir = __DIR__ . '/../transcriptions/';
$transId = uniqid('trans_', true);
$transFile = $transDir . $transId . '.json';

$result['id'] = $transId;
$result['session_id'] = $sessionId;
$result['original_file'] = basename($filePath);
$result['audio_path'] = $filePath;
$result['created_at'] = date('Y-m-d H:i:s');

file_put_contents($transFile, json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode([
    'id' => $transId,
    'text' => $result['text'],
    'segments' => $result['segments'],
    'language' => $result['language']
]);
```

**Step 3: Test upload API**

Run: `curl -X POST -F "files[]=@sample.mp3" http://localhost/Speech-to-Text/api/upload.php`
Expected: JSON with session_id and file details

**Step 4: Test transcribe API**

Run: `curl -X POST -H "Content-Type: application/json" -d '{"file_path":"uploads/sess_.../file.mp3","session_id":"sess_..."}' http://localhost/Speech-to-Text/api/transcribe.php`
Expected: JSON with transcription text, segments, word timestamps

**Step 5: Commit**

```bash
git add api/upload.php api/transcribe.php
git commit -m "feat: add upload and transcription API endpoints"
```

---

### Task 6: Mic Recording Tab

**Files:**
- Modify: `index.php` (fill in dictation tab content)
- Create: `assets/js/dictation.js`

**Step 1: Add dictation tab HTML to index.php**

Inside `#tab-dictation`:
```html
<div class="dictation-card">
    <div class="mic-container">
        <button class="mic-btn" id="micBtn">
            <svg class="mic-icon"><!-- microphone icon --></svg>
        </button>
        <p class="mic-label" id="micLabel">Click to start recording</p>
    </div>
    <canvas class="waveform" id="waveform" width="600" height="100"></canvas>
    <div class="timer" id="timer">00:00</div>
    <button class="btn-primary" id="stopTranscribeBtn" hidden>Stop & Transcribe</button>
</div>
```

**Step 2: Write dictation.js**

Key functionality:
- Request microphone access via `navigator.mediaDevices.getUserMedia({ audio: true })`
- Use `MediaRecorder` API to record audio as webm/opus
- Draw real-time waveform on `<canvas>` using `AnalyserNode` from Web Audio API
- Timer: update every second showing mm:ss
- Mic button toggles recording state (idle → recording → stopped)
- On "Stop & Transcribe": stop MediaRecorder, create Blob, upload to `api/upload.php` as file
- Then call `api/transcribe.php` and redirect to `editor.php?id={id}`
- Add script tag to index.php: `<script src="assets/js/dictation.js"></script>`

**Step 3: Test manually**

Open dictation tab, click mic, speak, stop.
Expected: Recording works, waveform shows, timer counts, file uploads and transcribes.

**Step 4: Commit**

```bash
git add index.php assets/js/dictation.js
git commit -m "feat: add direct dictation tab with mic recording and waveform"
```

---

### Task 7: Editor Page with TinyMCE

**Files:**
- Create: `editor.php`
- Create: `assets/js/editor.js`

**Step 1: Write editor.php**

```php
<?php
$transId = $_GET['id'] ?? '';
$transFile = __DIR__ . '/transcriptions/' . $transId . '.json';

if (!$transId || !file_exists($transFile)) {
    header('Location: index.php');
    exit;
}

$transcription = json_decode(file_get_contents($transFile), true);
$audioPath = $transcription['audio_path'] ?? '';
$fileName = $transcription['original_file'] ?? 'Untitled';

// Build word-level HTML
$wordHtml = '';
foreach ($transcription['segments'] as $segment) {
    if (!empty($segment['words'])) {
        foreach ($segment['words'] as $word) {
            $w = htmlspecialchars($word['word']);
            $start = $word['start'];
            $end = $word['end'];
            $wordHtml .= "<span class=\"word\" data-start=\"$start\" data-end=\"$end\">$w</span> ";
        }
    } else {
        $wordHtml .= htmlspecialchars($segment['text']) . ' ';
    }
    $wordHtml .= '<br>';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editor - <?= htmlspecialchars($fileName) ?></title>
    <link rel="stylesheet" href="assets/css/style.css">
    <script src="https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js" referrerpolicy="origin"></script>
</head>
<body class="editor-page">
    <!-- Header -->
    <div class="editor-header">
        <a href="index.php" class="back-btn">&larr; Back</a>
        <h2 class="file-name"><?= htmlspecialchars($fileName) ?></h2>
        <div class="export-group">
            <div class="export-dropdown">
                <button class="btn-export">Export &darr;</button>
                <div class="export-menu">
                    <a href="api/export.php?id=<?= $transId ?>&format=docx">DOCX</a>
                    <a href="api/export.php?id=<?= $transId ?>&format=pdf">PDF</a>
                    <a href="api/export.php?id=<?= $transId ?>&format=txt">TXT</a>
                    <a href="api/export.php?id=<?= $transId ?>&format=srt">SRT</a>
                </div>
            </div>
            <button class="btn-save" id="saveBtn">Save</button>
        </div>
    </div>

    <!-- TinyMCE Editor -->
    <div class="editor-container">
        <textarea id="editor"><?= $wordHtml ?></textarea>
    </div>

    <!-- Synced Audio Player (fixed bottom) -->
    <div class="audio-player" id="audioPlayer">
        <audio id="audio" src="api/audio.php?id=<?= $transId ?>"></audio>
        <div class="player-controls">
            <button class="player-btn" id="playBtn">&#9654;</button>
            <span class="time-display">
                <span id="currentTime">0:00</span> / <span id="totalTime">0:00</span>
            </span>
            <input type="range" class="seek-bar" id="seekBar" min="0" max="100" value="0">
            <div class="speed-control">
                <button class="speed-btn active" data-speed="1">1x</button>
                <button class="speed-btn" data-speed="1.5">1.5x</button>
                <button class="speed-btn" data-speed="2">2x</button>
                <button class="speed-btn" data-speed="0.5">0.5x</button>
                <button class="speed-btn" data-speed="0.75">0.75x</button>
            </div>
            <input type="range" class="volume-bar" id="volumeBar" min="0" max="100" value="100">
        </div>
    </div>

    <script>
        const TRANSCRIPTION_ID = '<?= $transId ?>';
    </script>
    <script src="assets/js/player.js"></script>
    <script src="assets/js/editor.js"></script>
</body>
</html>
```

**Step 2: Create api/audio.php to serve audio files**

```php
<?php
$transId = $_GET['id'] ?? '';
$transFile = __DIR__ . '/../transcriptions/' . $transId . '.json';

if (!$transId || !file_exists($transFile)) {
    http_response_code(404);
    exit;
}

$transcription = json_decode(file_get_contents($transFile), true);
$audioPath = $transcription['audio_path'] ?? '';

if (!file_exists($audioPath)) {
    http_response_code(404);
    exit;
}

$ext = strtolower(pathinfo($audioPath, PATHINFO_EXTENSION));
$mimeTypes = [
    'mp3' => 'audio/mpeg', 'wav' => 'audio/wav', 'ogg' => 'audio/ogg',
    'mp4' => 'audio/mp4', 'm4a' => 'audio/mp4', 'wma' => 'audio/x-ms-wma',
    'webm' => 'audio/webm'
];
$mime = $mimeTypes[$ext] ?? 'application/octet-stream';

header("Content-Type: $mime");
header("Content-Length: " . filesize($audioPath));
header("Accept-Ranges: bytes");
readfile($audioPath);
```

**Step 3: Write editor.js**

Key functionality:
- Initialize TinyMCE on `#editor` with toolbar: bold, italic, underline, h1-h3, bullist, numlist, alignleft, aligncenter, alignright
- Set `content_css` to include word highlight styles
- On TinyMCE init: attach click handlers to all `.word` spans inside editor
- Click on `.word` span → get `data-start` → `audio.currentTime = start`
- Register TinyMCE `setup` callback for custom events
- Save button: POST editor HTML content to `api/save.php`

**Step 4: Commit**

```bash
git add editor.php api/audio.php assets/js/editor.js
git commit -m "feat: add editor page with TinyMCE and audio serving endpoint"
```

---

### Task 8: Synced Audio Player

**Files:**
- Create: `assets/js/player.js`

**Step 1: Write player.js**

Key functionality:
- **Play/Pause toggle:** Click `#playBtn` → toggle `audio.play()` / `audio.pause()`, update button icon (▶ / ❚❚)
- **Seek bar:** `audio.ontimeupdate` → update `#seekBar` value. `#seekBar` input → `audio.currentTime = ...`
- **Time display:** Format seconds to `m:ss`, update `#currentTime` on timeupdate, `#totalTime` on loadedmetadata
- **Speed control:** Click `.speed-btn` → `audio.playbackRate = speed`, toggle `active` class
- **Volume:** `#volumeBar` input → `audio.volume = value / 100`
- **Word sync (audio → editor):** On `timeupdate`, find current word span where `data-start <= currentTime < data-end`, add `.active` class, remove from previous word. Scroll word into view if needed.
- **Word sync (editor → audio):** Handled in editor.js (click word → seek audio)
- **Keyboard shortcuts:**
  - `Space` → play/pause (prevent scroll)
  - `ArrowLeft` → skip back 5s
  - `ArrowRight` → skip forward 5s
  - Only when TinyMCE is not focused

**Step 2: Test manually**

Open editor page. Play audio.
Expected: Words highlight in sync, clicking word seeks audio, keyboard shortcuts work.

**Step 3: Commit**

```bash
git add assets/js/player.js
git commit -m "feat: add synced audio player with two-way word-level sync"
```

---

### Task 9: Save Edited Transcription

**Files:**
- Create: `api/save.php`

**Step 1: Write api/save.php**

```php
<?php
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$transId = $input['id'] ?? '';
$content = $input['content'] ?? '';

$transFile = __DIR__ . '/../transcriptions/' . $transId . '.json';

if (!$transId || !file_exists($transFile)) {
    http_response_code(404);
    echo json_encode(['error' => 'Transcription not found']);
    exit;
}

$transcription = json_decode(file_get_contents($transFile), true);
$transcription['edited_html'] = $content;
$transcription['updated_at'] = date('Y-m-d H:i:s');

file_put_contents($transFile, json_encode($transcription, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode(['success' => true]);
```

**Step 2: Commit**

```bash
git add api/save.php
git commit -m "feat: add save endpoint for edited transcriptions"
```

---

### Task 10: Export API (DOCX, PDF, TXT, SRT)

**Files:**
- Create: `api/export.php`

**Step 1: Write api/export.php**

```php
<?php
require_once __DIR__ . '/../vendor/autoload.php';

use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory as WordIOFactory;
use Dompdf\Dompdf;

$transId = $_GET['id'] ?? '';
$format = $_GET['format'] ?? 'txt';
$transFile = __DIR__ . '/../transcriptions/' . $transId . '.json';

if (!$transId || !file_exists($transFile)) {
    http_response_code(404);
    exit('Transcription not found');
}

$transcription = json_decode(file_get_contents($transFile), true);
$fileName = pathinfo($transcription['original_file'], PATHINFO_FILENAME);

// Get plain text from segments
$plainText = '';
foreach ($transcription['segments'] as $seg) {
    $plainText .= trim($seg['text']) . "\n";
}

// Use edited HTML if available
$editedHtml = $transcription['edited_html'] ?? '';

switch ($format) {
    case 'docx':
        $phpWord = new PhpWord();
        $section = $phpWord->addSection();
        if ($editedHtml) {
            \PhpOffice\PhpWord\Shared\Html::addHtml($section, $editedHtml);
        } else {
            $section->addText($plainText);
        }
        header('Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        header("Content-Disposition: attachment; filename=\"{$fileName}.docx\"");
        $writer = WordIOFactory::createWriter($phpWord, 'Word2007');
        $writer->save('php://output');
        break;

    case 'pdf':
        $dompdf = new Dompdf();
        $html = $editedHtml ?: '<pre>' . htmlspecialchars($plainText) . '</pre>';
        $dompdf->loadHtml("<html><body style='font-family:sans-serif;'>$html</body></html>");
        $dompdf->setPaper('A4');
        $dompdf->render();
        $dompdf->stream("{$fileName}.pdf", ['Attachment' => true]);
        break;

    case 'srt':
        header('Content-Type: text/plain');
        header("Content-Disposition: attachment; filename=\"{$fileName}.srt\"");
        $counter = 1;
        foreach ($transcription['segments'] as $seg) {
            $startSrt = formatSrtTime($seg['start']);
            $endSrt = formatSrtTime($seg['end']);
            echo "$counter\n$startSrt --> $endSrt\n" . trim($seg['text']) . "\n\n";
            $counter++;
        }
        break;

    case 'txt':
    default:
        header('Content-Type: text/plain');
        header("Content-Disposition: attachment; filename=\"{$fileName}.txt\"");
        echo $plainText;
        break;
}

function formatSrtTime($seconds) {
    $h = floor($seconds / 3600);
    $m = floor(($seconds % 3600) / 60);
    $s = floor($seconds % 60);
    $ms = round(($seconds - floor($seconds)) * 1000);
    return sprintf('%02d:%02d:%02d,%03d', $h, $m, $s, $ms);
}
```

**Step 2: Test export**

Open `http://localhost/Speech-to-Text/api/export.php?id={trans_id}&format=txt`
Expected: Text file downloads with transcription content.

**Step 3: Commit**

```bash
git add api/export.php
git commit -m "feat: add export API supporting DOCX, PDF, TXT, and SRT formats"
```

---

### Task 11: Final Integration & Polish

**Files:**
- Modify: `index.php` (add dictation script tag)
- Modify: `assets/css/style.css` (final tweaks)
- Review all files for consistency

**Step 1: Add .gitignore**

```
vendor/
uploads/*
!uploads/.gitkeep
transcriptions/*
!transcriptions/.gitkeep
*.pyc
__pycache__/
```

**Step 2: Update php.ini settings (document for user)**

Ensure these WAMP php.ini settings support large uploads:
```ini
upload_max_filesize = 200M
post_max_size = 210M
max_execution_time = 300
max_input_time = 300
```

**Step 3: End-to-end test**

1. Open `http://localhost/Speech-to-Text/`
2. Upload an MP3 file → Transcribe → Verify redirect to editor
3. In editor: verify words are clickable, audio syncs, formatting works
4. Export as DOCX, PDF, TXT, SRT → verify downloads
5. Test Mic Recording tab → record → transcribe → editor
6. Test keyboard shortcuts in player

**Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: add gitignore and finalize integration"
```
