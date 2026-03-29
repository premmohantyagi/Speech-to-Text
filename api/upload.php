<?php
header('Content-Type: application/json');

$uploadDir = __DIR__ . '/../uploads/';
$allowedExt = ['mp3','mp4','wav','wma','ogg','m4a','dss','ds2','webm','flac','aac'];
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
    echo json_encode(["error" => "Maximum $maxFiles files allowed"]);
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
        continue;
    }
    if ($size > $maxSize) {
        continue;
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
