# Speech-to-Text (Whisper) — Design Document

## Overview

A web application that transcribes audio files and live dictation to text using OpenAI's open-source Whisper model, running locally and free of cost. Features a rich text editor with synced audio playback for reviewing and editing transcriptions.

## Stack

- **Frontend:** HTML5, CSS3, vanilla JS, TinyMCE (rich text editor)
- **Backend:** PHP on WAMP
- **Transcription:** Python `openai-whisper` via `shell_exec()`, word-level timestamps
- **Export:** PhpWord (DOCX), DomPDF (PDF), plain TXT, SRT/VTT
- **Audio Player:** Custom HTML5 audio player with two-way sync

## Architecture

```
Frontend (HTML/CSS/JS)
  ├── Upload Files UI
  ├── Mic Recording (mic recording)
  └── Dictation Review Editor (TinyMCE + synced player)
        │
        ▼
PHP Backend (WAMP)
  ├── File Upload Handler
  ├── Python Subprocess (openai-whisper, word-level timestamps → JSON)
  └── Export (DOCX/PDF/TXT/SRT via PhpWord + DomPDF)
```

## Pages

### Page 1: Home (`index.php`)

Two tabs:

**Tab 1 — Upload Files:**
- Drag & drop zone with cloud upload icon
- "browse" link to open file picker
- Supported formats: DOC, DOCX, PDF, MP3, MP4, WAV, WMA, OGG, M4A, DSS, DS2, ZIP
- Max 4 files, up to 170MB each
- Upload progress bar per file
- "Transcribe" button to start processing

**Tab 2 — Mic Recording:**
- Large mic button to start/stop recording
- Live waveform visualization while recording
- Timer showing recording duration
- "Stop & Transcribe" button

**Processing state:** Spinner with "Transcribing with Whisper..." message

### Page 2: Dictation Review Editor (`editor.php`)

**Layout (top to bottom):**

| Section | Description |
|---|---|
| **Header bar** | File name, back button, export dropdown (DOCX/PDF/TXT/SRT) |
| **TinyMCE Editor** | Rich text with word-level timestamp spans, full formatting toolbar |
| **Synced Audio Player** | Fixed bottom bar — play/pause, seek, speed, volume, time display |

## Synced Audio Player

**How Whisper provides timestamps:**
- `--word_timestamps True` returns JSON with every word + start/end time
- Example: `{"word": "Hello", "start": 0.0, "end": 0.42}`

**How sync works:**

Each word in TinyMCE is wrapped in a span:
```html
<span class="word" data-start="0.0" data-end="0.42">Hello</span>
```

**Two-way sync:**
1. **Click word → audio jumps** — seeks audio to word's `data-start` time
2. **Audio plays → word highlights** — current word highlighted based on `currentTime`

**Player controls:**
- Play / Pause / Stop
- Seek bar, speed control (0.5x–2x), volume
- Current time / total duration
- Keyboard shortcuts (Space = play/pause, arrows = skip 5s)
- Fixed at bottom of editor page

## Editor Features

- Editable transcribed text
- Full formatting: bold, italic, underline, headings, lists, alignment
- Word highlighting synced with audio
- Click any word to jump audio
- Speaker labels (if detected)
- Export: DOCX, PDF, TXT, SRT

## File Structure

```
Speech-to-Text/
├── index.php
├── editor.php
├── api/
│   ├── upload.php
│   ├── transcribe.php
│   ├── export.php
│   └── save.php
├── python/
│   └── transcribe.py
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── upload.js
│   │   ├── dictation.js
│   │   ├── editor.js
│   │   └── player.js
│   └── img/
├── uploads/
├── transcriptions/
├── vendor/
└── composer.json
```

## Dependencies

**Python:**
- `openai-whisper` (`pip install openai-whisper`)
- `ffmpeg` (required by Whisper)

**PHP (Composer):**
- `phpoffice/phpword` (DOCX export)
- `dompdf/dompdf` (PDF export)

**Frontend:**
- TinyMCE (CDN or self-hosted)
