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
