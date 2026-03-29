(function () {
    'use strict';

    const micBtn = document.getElementById('micBtn');
    const micLabel = document.getElementById('micLabel');
    const waveformCanvas = document.getElementById('waveform');
    const timerEl = document.getElementById('timer');
    const stopBtn = document.getElementById('stopTranscribeBtn');
    const overlay = document.getElementById('processingOverlay');
    const processingFileName = document.getElementById('processingFileName');

    let mediaRecorder = null;
    let audioChunks = [];
    let stream = null;
    let audioContext = null;
    let analyser = null;
    let animationId = null;
    let timerInterval = null;
    let seconds = 0;
    let isRecording = false;

    // ---- Timer ----
    function formatTime(totalSeconds) {
        const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        return m + ':' + s;
    }

    function startTimer() {
        seconds = 0;
        timerEl.textContent = '00:00';
        timerInterval = setInterval(function () {
            seconds++;
            timerEl.textContent = formatTime(seconds);
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // ---- Waveform Visualization ----
    function drawWaveform() {
        if (!analyser) return;

        const ctx = waveformCanvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function draw() {
            if (!isRecording) return;
            animationId = requestAnimationFrame(draw);

            analyser.getByteFrequencyData(dataArray);

            const width = waveformCanvas.width;
            const height = waveformCanvas.height;
            ctx.clearRect(0, 0, width, height);

            const barCount = 60;
            const barWidth = width / barCount - 2;
            const step = Math.floor(bufferLength / barCount);

            for (let i = 0; i < barCount; i++) {
                const value = dataArray[i * step];
                const barHeight = (value / 255) * height * 0.9;
                const x = i * (barWidth + 2);
                const y = (height - barHeight) / 2;

                // Gradient from green to indigo based on bar height
                const ratio = value / 255;
                const r = Math.round(34 + ratio * (79 - 34));
                const g = Math.round(197 + ratio * (70 - 197));
                const b = Math.round(94 + ratio * (229 - 94));

                ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
                ctx.fillRect(x, y, barWidth, barHeight || 2);
            }
        }

        draw();
    }

    function clearWaveform() {
        const ctx = waveformCanvas.getContext('2d');
        ctx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
    }

    // ---- Recording ----
    async function startRecording() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
            alert('Microphone access denied. Please allow microphone permissions and try again.');
            return;
        }

        audioChunks = [];

        // Set up MediaRecorder
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : 'audio/webm';
        mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });

        mediaRecorder.addEventListener('dataavailable', function (e) {
            if (e.data.size > 0) {
                audioChunks.push(e.data);
            }
        });

        mediaRecorder.start(250); // collect data every 250ms

        // Set up Web Audio API for visualization
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        isRecording = true;

        // Update UI
        micBtn.classList.add('recording');
        micLabel.textContent = 'Recording...';
        stopBtn.hidden = false;

        startTimer();
        drawWaveform();
    }

    function stopRecording() {
        isRecording = false;

        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }

        stopTimer();

        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        // Update UI
        micBtn.classList.remove('recording');
        micLabel.textContent = 'Click to start recording';
        stopBtn.hidden = true;
    }

    function cleanup() {
        if (stream) {
            stream.getTracks().forEach(function (track) { track.stop(); });
            stream = null;
        }
        if (audioContext) {
            audioContext.close();
            audioContext = null;
            analyser = null;
        }
        clearWaveform();
    }

    // ---- Upload & Transcribe ----
    async function uploadAndTranscribe(blob) {
        // Show processing overlay
        overlay.classList.add('active');
        if (processingFileName) {
            processingFileName.textContent = 'recording.webm';
        }

        try {
            // Step 1: Upload the recording
            var formData = new FormData();
            formData.append('files[]', blob, 'recording.webm');

            var uploadRes = await fetch('api/upload.php', {
                method: 'POST',
                body: formData
            });

            var uploadData = await uploadRes.json();

            if (!uploadData.files || uploadData.files.length === 0) {
                throw new Error(uploadData.error || 'Upload failed');
            }

            // Step 2: Transcribe
            var transcribeRes = await fetch('api/transcribe.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_path: uploadData.files[0].path, session_id: uploadData.session_id })
            });

            var transcribeData = await transcribeRes.json();

            if (transcribeData.error) {
                throw new Error(transcribeData.error || 'Transcription failed');
            }

            // Redirect to editor
            window.location.href = 'editor.php?id=' + transcribeData.id;
        } catch (err) {
            overlay.classList.remove('active');
            alert('Error: ' + err.message);
        }
    }

    // ---- Event Listeners ----
    micBtn.addEventListener('click', function () {
        if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
            cleanup();
        }
    });

    stopBtn.addEventListener('click', function () {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

        mediaRecorder.addEventListener('stop', function () {
            var blob = new Blob(audioChunks, { type: 'audio/webm' });
            cleanup();
            uploadAndTranscribe(blob);
        }, { once: true });

        stopRecording();
    });
})();
