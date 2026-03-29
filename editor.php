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
    <script src="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.5/tinymce.min.js"></script>
</head>
<body class="editor-page">
    <!-- Header -->
    <div class="editor-header">
        <a href="index.php" class="back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back
        </a>
        <h2 class="file-name"><?= htmlspecialchars($fileName) ?></h2>
        <div class="export-group">
            <div class="export-dropdown">
                <button class="btn-export">
                    Export
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
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
        <audio id="audio" src="api/audio.php?id=<?= $transId ?>" preload="auto"></audio>
        <div class="player-controls">
            <button class="player-btn" id="playBtn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
            </button>
            <span class="time-display">
                <span id="currentTime">0:00</span> / <span id="totalTime">0:00</span>
            </span>
            <input type="range" class="seek-bar" id="seekBar" min="0" max="100" value="0" step="0.1">
            <div class="speed-control">
                <button class="speed-btn" data-speed="0.5">0.5x</button>
                <button class="speed-btn" data-speed="0.75">0.75x</button>
                <button class="speed-btn active" data-speed="1">1x</button>
                <button class="speed-btn" data-speed="1.5">1.5x</button>
                <button class="speed-btn" data-speed="2">2x</button>
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
