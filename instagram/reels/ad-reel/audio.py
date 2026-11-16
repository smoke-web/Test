#!/usr/bin/env python3
"""Звук для рекламного Reels: озвучка (Piper TTS, голос Irina) + фоновая музыка + сведение.

Музыка синтезируется этим скриптом с нуля (аккорды, мягкий пэд, арпеджио),
поэтому никаких авторских прав третьих лиц на неё нет.

Запуск:  python3 instagram/reels/ad-reel/audio.py
Нужно:   pip install piper-tts numpy, ffmpeg.
Результат: audio/voice.wav, audio/music.wav, audio/mix.wav
"""
import os
import subprocess
import tarfile
import urllib.request
import wave

import numpy as np

DIR = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(DIR, "audio")
CACHE = os.path.expanduser("~/.cache/piper-voices")
VOICE_URL = "https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-ru-irinia-medium.tar.gz"
MODEL = os.path.join(CACHE, "ru-irinia-medium.onnx")
SR = 44100
DURATION = 28.5

# (время начала в секундах, текст) — синхронизировано с таймлайном в make.js
PHRASES = [
    (0.3, "Ваш сайт выглядит дешевле, чем ваш бизнес?"),
    (4.6, "Клиенты замечают это за пять секунд."),
    (8.1, "Я создаю сайты, которым доверяют с первого взгляда."),
    (15.9, "Индивидуальный дизайн, без шаблонов. Запуск от четырнадцати дней."),
    (21.6, "Я беру всего три проекта в месяц. Напишите слово «проект» в директ."),
]


def run(*args):
    subprocess.run(args, check=True)


def ensure_voice():
    if os.path.exists(MODEL):
        return
    os.makedirs(CACHE, exist_ok=True)
    tgz = os.path.join(CACHE, "voice.tgz")
    urllib.request.urlretrieve(VOICE_URL, tgz)
    with tarfile.open(tgz) as t:
        t.extractall(CACHE, filter="data")
    os.remove(tgz)


def make_voice():
    """Каждая фраза синтезируется отдельно и ставится на свою отметку времени."""
    ensure_voice()
    parts = []
    for i, (_, text) in enumerate(PHRASES):
        f = os.path.join(OUT, f"phrase{i + 1}.wav")
        # length-scale > 1: речь чуть медленнее и спокойнее, вызывает больше доверия
        subprocess.run(["piper", "-m", MODEL, "--length-scale", "1.08", "-f", f],
                       input=text.encode(), check=True, stderr=subprocess.DEVNULL)
        parts.append(f)
    inputs, chains = [], []
    for i, (f, (start, _)) in enumerate(zip(parts, PHRASES)):
        inputs += ["-i", f]
        ms = int(start * 1000)
        chains.append(f"[{i}:a]aresample={SR},adelay={ms}|{ms},apad[v{i}]")
    mix = "".join(f"[v{i}]" for i in range(len(parts)))
    # Тёплый тембр: срез низа, лёгкий подъём «тела» и разборчивости, мягкая компрессия
    fx = ("highpass=f=90,equalizer=f=220:t=q:w=1:g=2,equalizer=f=3200:t=q:w=1.2:g=2.5,"
          "acompressor=threshold=-22dB:ratio=3:attack=5:release=120:makeup=3,"
          "aecho=0.8:0.5:40:0.12")
    run("ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex",
        ";".join(chains) + f";{mix}amix=inputs={len(parts)}:normalize=0,{fx},"
        f"atrim=0:{DURATION},pan=stereo|c0=c0|c1=c0[out]",
        "-map", "[out]", "-ar", str(SR), os.path.join(OUT, "voice.wav"))


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def make_music():
    """Спокойный эмбиент в ре мажоре: Dmaj9 – Bm9 – Gmaj7 – A6sus, 2 круга."""
    n = int(SR * DURATION)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    chords = [
        (50, [62, 66, 69, 73, 76]),  # Dmaj9
        (47, [59, 62, 66, 69, 73]),  # Bm9
        (43, [59, 62, 66, 67, 71]),  # Gmaj7
        (45, [57, 62, 64, 66, 69]),  # A6sus
    ] * 2
    clen = DURATION / len(chords)
    rng = np.random.default_rng(7)

    for ci, (bass, notes) in enumerate(chords):
        s0 = ci * clen
        # Пэд: медленная атака, перекрытие соседних аккордов
        a, b = max(0, s0 - 0.8), min(DURATION, s0 + clen + 1.2)
        i0, i1 = int(a * SR), int(b * SR)
        tt = t[i0:i1] - a
        L = b - a
        env = np.minimum(1, tt / 1.4) * np.minimum(1, (L - tt) / 1.4)
        env = np.clip(env, 0, 1) ** 1.5
        for k, note in enumerate(notes):
            f = midi(note)
            for ch, det in ((0, -0.12), (1, 0.12)):
                ph = rng.uniform(0, 2 * np.pi)
                w = (np.sin(2 * np.pi * (f + det) * tt + ph)
                     + 0.25 * np.sin(2 * np.pi * 2 * (f + det) * tt + ph)
                     + 0.08 * np.sin(2 * np.pi * 3 * (f + det) * tt))
                out[ch, i0:i1] += 0.05 * env * w * (1 + 0.15 * np.sin(2 * np.pi * 0.2 * tt + k))
        # Мягкий бас
        bw = np.sin(2 * np.pi * midi(bass) * tt) * env
        out[:, i0:i1] += 0.10 * bw
        # Арпеджио «колокольчики», октавой выше, с затуханием
        steps = 6
        for j in range(steps):
            st = s0 + j * clen / steps + 0.02 * rng.standard_normal()
            if st < 0.5 or st > DURATION - 1.5:
                continue
            note = notes[[0, 2, 4, 3, 1, 2][j]] + 12
            p0 = int(st * SR)
            ln = min(int(2.2 * SR), n - p0)
            tp = np.arange(ln) / SR
            pe = np.exp(-tp * 2.6) * np.minimum(1, tp / 0.008)
            pw = (np.sin(2 * np.pi * midi(note) * tp) + 0.3 * np.sin(2 * np.pi * 2 * midi(note) * tp) * np.exp(-tp * 6))
            pan = 0.5 + 0.35 * np.sin(j * 1.7 + ci)
            out[0, p0:p0 + ln] += 0.06 * pe * pw * (1 - pan)
            out[1, p0:p0 + ln] += 0.06 * pe * pw * pan

    # Сглаживание верхов (однополюсный НЧ-фильтр через свёртку)
    k = np.exp(-np.arange(64) / 6.0)
    k /= k.sum()
    out = np.stack([np.convolve(c, k, mode="same") for c in out])
    # Реверберация: свёртка с затухающим шумом (FFT)
    ir_len = int(2.8 * SR)
    m = 1 << int(np.ceil(np.log2(n + ir_len)))
    wet = []
    for ch in range(2):
        ir = rng.standard_normal(ir_len) * np.exp(-np.arange(ir_len) / SR * 2.2)
        ir = np.convolve(ir, k, mode="same")
        ir /= np.sqrt((ir ** 2).sum())
        y = np.fft.irfft(np.fft.rfft(out[ch], m) * np.fft.rfft(ir, m), m)[:n]
        wet.append(y)
    out = 0.6 * out + 0.55 * np.array(wet)
    # Плавное начало и конец
    fade = np.minimum(1, t / 1.5) * np.minimum(1, (DURATION - t) / 2.5)
    out *= np.clip(fade, 0, 1)
    out /= np.abs(out).max() + 1e-9
    out *= 0.89
    pcm = (out.T * 32767).astype(np.int16)
    with wave.open(os.path.join(OUT, "music.wav"), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def lufs(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", "ebur128", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    return float(r.split("Integrated loudness:")[1].split("I:")[1].split("LUFS")[0])


def mix():
    """Музыка тихо на фоне и дополнительно приглушается, пока звучит голос.
    Громкость выравнивается одним постоянным усилением (без динамической нормализации),
    чтобы в паузах музыка не становилась громче."""
    tmp = os.path.join(OUT, "mix_raw.wav")
    run("ffmpeg", "-y", "-loglevel", "error",
        "-i", os.path.join(OUT, "voice.wav"), "-i", os.path.join(OUT, "music.wav"),
        "-filter_complex",
        "[0:a]asplit=2[v][sc];"
        "[1:a]volume=0.07[m];"
        "[m][sc]sidechaincompress=threshold=0.03:ratio=3:attack=80:release=700[md];"
        "[v][md]amix=inputs=2:normalize=0[out]",
        "-map", "[out]", "-ar", str(SR), tmp)
    gain = -14.0 - lufs(tmp)
    run("ffmpeg", "-y", "-loglevel", "error", "-i", tmp,
        "-af", f"volume={gain:.2f}dB,alimiter=limit=0.85:level=false",
        "-ar", str(SR), os.path.join(OUT, "mix.wav"))
    os.remove(tmp)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    make_voice()
    make_music()
    mix()
    print("audio done")
