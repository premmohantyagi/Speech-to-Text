// player.js — Synced audio player: play/pause, seek, time display, speed, volume, word sync, keyboard shortcuts

(function () {
    'use strict';

    var audio = document.getElementById('audio');
    var playBtn = document.getElementById('playBtn');
    var seekBar = document.getElementById('seekBar');
    var currentTimeEl = document.getElementById('currentTime');
    var totalTimeEl = document.getElementById('totalTime');
    var volumeBar = document.getElementById('volumeBar');
    var speedBtns = document.querySelectorAll('.speed-btn');

    var lastActiveWord = null;

    // SVG icons
    var playIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    var pauseIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="3" width="4" height="18"/><rect x="15" y="3" width="4" height="18"/></svg>';

    // --- Helpers ---

    function formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        var totalSec = Math.floor(seconds);
        var m = Math.floor(totalSec / 60);
        var s = totalSec % 60;
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    // --- 1. Play/Pause Toggle ---

    playBtn.addEventListener('click', function () {
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    });

    audio.addEventListener('play', function () {
        playBtn.innerHTML = pauseIcon;
    });

    audio.addEventListener('pause', function () {
        playBtn.innerHTML = playIcon;
    });

    // --- 2. Seek Bar ---

    audio.addEventListener('timeupdate', function () {
        if (audio.duration) {
            seekBar.value = (audio.currentTime / audio.duration) * 100;
        }
        // Update current time display
        currentTimeEl.textContent = formatTime(audio.currentTime);

        // Word sync
        syncActiveWord();
    });

    seekBar.addEventListener('input', function () {
        if (audio.duration) {
            audio.currentTime = (seekBar.value / 100) * audio.duration;
        }
    });

    // --- 3. Time Display ---

    audio.addEventListener('loadedmetadata', function () {
        totalTimeEl.textContent = formatTime(audio.duration);
    });

    // --- 4. Speed Control ---

    speedBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var speed = parseFloat(btn.getAttribute('data-speed'));
            audio.playbackRate = speed;
            speedBtns.forEach(function (b) {
                b.classList.remove('active');
            });
            btn.classList.add('active');
        });
    });

    // --- 5. Volume Control ---

    volumeBar.addEventListener('input', function () {
        audio.volume = volumeBar.value / 100;
    });

    // --- 6. Word Sync (Audio → Editor) ---

    function syncActiveWord() {
        var editor = typeof tinymce !== 'undefined' ? tinymce.activeEditor : null;
        if (!editor) return;

        var body = editor.getBody();
        if (!body) return;

        var words = body.querySelectorAll('.word');
        var currentTime = audio.currentTime;
        var activeWord = null;

        for (var i = 0; i < words.length; i++) {
            var start = parseFloat(words[i].getAttribute('data-start'));
            var end = parseFloat(words[i].getAttribute('data-end'));
            if (currentTime >= start && currentTime < end) {
                activeWord = words[i];
                break;
            }
        }

        if (activeWord === lastActiveWord) return;

        // Remove active class from all words
        for (var j = 0; j < words.length; j++) {
            words[j].classList.remove('active');
        }

        if (activeWord) {
            activeWord.classList.add('active');
            activeWord.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        lastActiveWord = activeWord;
    }

    // --- 7. Keyboard Shortcuts ---

    document.addEventListener('keydown', function (e) {
        // Don't intercept if user is typing in TinyMCE
        var active = document.activeElement;
        if (active && active.tagName === 'IFRAME') return;
        // Also check if focus is inside any input/textarea on the page
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                if (audio.paused) {
                    audio.play();
                } else {
                    audio.pause();
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                audio.currentTime = Math.max(0, audio.currentTime - 5);
                break;
            case 'ArrowRight':
                e.preventDefault();
                audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
                break;
        }
    });

    // --- 8. Audio End ---

    audio.addEventListener('ended', function () {
        playBtn.innerHTML = playIcon;
        seekBar.value = 0;
    });

})();
