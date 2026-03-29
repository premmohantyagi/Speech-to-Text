<?php
header('Content-Type: application/json');

// Whisper transcription can take minutes on CPU
set_time_limit(600);
ini_set('max_execution_time', 600);

$input = json_decode(file_get_contents('php://input'), true);
$filePath = $input['file_path'] ?? '';
$sessionId = $input['session_id'] ?? '';

if (!$filePath || !file_exists($filePath)) {
    http_response_code(400);
    echo json_encode(['error' => 'File not found']);
    exit;
}

// Call Python whisper script
$pythonPath = 'python';
$scriptPath = __DIR__ . '/../python/transcribe.py';
$escapedFile = escapeshellarg($filePath);
$command = "$pythonPath $scriptPath $escapedFile 2>NUL";

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
