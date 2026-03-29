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
