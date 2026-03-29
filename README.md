# Speech-to-Text

A web application that transcribes audio files and live mic recordings to text using advanced speech recognition. Runs entirely on your local machine — free of cost, no API keys needed.

## Features

- **Upload audio files** — drag & drop or browse (MP3, MP4, WAV, WMA, OGG, M4A, DSS, DS2, WEBM, FLAC, AAC)
- **Mic recording** — record directly from your microphone with live waveform visualization
- **Rich text editor** — edit transcriptions in a full-featured editor (TinyMCE) with bold, italic, headings, lists, alignment
- **Synced audio player** — two-way sync between audio and text:
  - Click any word in the editor to jump to that point in the audio
  - Words highlight in real-time as audio plays
- **Playback controls** — play/pause, seek, speed (0.5x–2x), volume, keyboard shortcuts
- **Export** — download transcriptions as DOCX, PDF, TXT, or SRT
- **Save** — save edited transcriptions for later

## Requirements

- **WAMP/XAMPP** (PHP 7.4+, Apache)
- **Python 3.8+**
- **FFmpeg**
- **Composer**

## Installation

### 1. Clone the repository

```bash
cd c:/wamp64/www
git clone https://github.com/premmohantyagi/Speech-to-Text.git
cd Speech-to-Text
```

### 2. Install PHP dependencies

```bash
composer install
```

### 3. Install Python Whisper

```bash
pip install openai-whisper
```

### 4. Install FFmpeg

Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to your system PATH.

Verify:
```bash
ffmpeg -version
```

### 5. Update PHP settings

In your WAMP `php.ini`, set these values to support large audio files and long transcription times:

```ini
upload_max_filesize = 200M
post_max_size = 210M
max_execution_time = 300
max_input_time = 300
```

Restart WAMP after making changes.

### 6. Open in browser

```
http://localhost/Speech-to-Text/
```

## Usage

### Upload Files

1. Open the app and stay on the **Upload Files** tab
2. Drag & drop an audio file or click **browse** to select one (up to 4 files, 170MB each)
3. Click **Transcribe**
4. Wait for Whisper to process (first run downloads the model, may take a few minutes)
5. You'll be redirected to the editor with the transcribed text

### Mic Recording

1. Switch to the **Mic Recording** tab
2. Click the microphone button to start recording
3. Speak — you'll see a live waveform and timer
4. Click **Stop & Transcribe**
5. The recording is sent to Whisper and you'll be redirected to the editor

### Editor

- **Edit text** — fix mistakes, add formatting using the toolbar
- **Play audio** — use the player bar at the bottom
- **Click a word** — audio jumps to that timestamp
- **Watch words highlight** — as audio plays, the current word is highlighted in yellow
- **Keyboard shortcuts:**
  - `Space` — play/pause
  - `Left arrow` — skip back 5 seconds
  - `Right arrow` — skip forward 5 seconds
- **Speed control** — 0.5x, 0.75x, 1x, 1.5x, 2x
- **Save** — click Save to preserve your edits
- **Export** — click Export to download as DOCX, PDF, TXT, or SRT

## Project Structure

```
Speech-to-Text/
├── index.php              # Home page (upload + mic recording)
├── editor.php             # Transcription editor with synced player
├── api/
│   ├── upload.php         # File upload handler
│   ├── transcribe.php     # Whisper transcription via Python
│   ├── audio.php          # Audio file streaming
│   ├── save.php           # Save edited transcription
│   └── export.php         # Export as DOCX/PDF/TXT/SRT
├── python/
│   └── transcribe.py      # Whisper script with word-level timestamps
├── assets/
│   ├── css/style.css      # Stylesheet
│   └── js/
│       ├── upload.js      # Upload & drag-drop logic
│       ├── dictation.js   # Mic recording logic
│       ├── editor.js      # TinyMCE setup & word click sync
│       └── player.js      # Synced audio player
├── uploads/               # Uploaded audio files
├── transcriptions/        # Transcription JSON files
└── composer.json          # PHP dependencies
```

## Notes

- First transcription takes longer because Whisper downloads the "base" model (~140MB)
- Transcription speed depends on your CPU — a 1-minute audio file takes roughly 30–60 seconds on CPU
- For faster transcription, use a GPU with CUDA support
- All processing happens locally — no data is sent to any external server
