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
