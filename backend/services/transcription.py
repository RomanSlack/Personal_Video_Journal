import os
import tempfile
import subprocess
from google.cloud import speech


def extract_audio(video_path: str) -> str:
    """Extract audio from video file using ffmpeg."""
    audio_path = tempfile.mktemp(suffix=".wav")

    cmd = [
        "ffmpeg",
        "-i", video_path,
        "-vn",  # No video
        "-acodec", "pcm_s16le",  # PCM 16-bit
        "-ar", "16000",  # 16kHz sample rate (optimal for Speech-to-Text)
        "-ac", "1",  # Mono
        "-y",  # Overwrite
        audio_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(f"ffmpeg failed: {result.stderr}")

    return audio_path


def transcribe_audio(audio_path: str) -> str:
    """Transcribe audio using Google Cloud Speech-to-Text."""
    client = speech.SpeechClient()

    with open(audio_path, "rb") as audio_file:
        content = audio_file.read()

    audio = speech.RecognitionAudio(content=content)

    # Use Chirp model for best quality
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=16000,
        language_code="en-US",
        model="chirp",  # Latest model with best accuracy
        enable_automatic_punctuation=True,
        enable_word_time_offsets=False,
    )

    # For longer audio, use long_running_recognize
    operation = client.long_running_recognize(config=config, audio=audio)
    response = operation.result(timeout=600)  # 10 minute timeout

    transcript_parts = []
    for result in response.results:
        if result.alternatives:
            transcript_parts.append(result.alternatives[0].transcript)

    return " ".join(transcript_parts)


def transcribe_video(video_path: str) -> str:
    """Full pipeline: extract audio from video and transcribe."""
    audio_path = None
    try:
        audio_path = extract_audio(video_path)
        transcript = transcribe_audio(audio_path)
        return transcript
    finally:
        # Cleanup temp audio file
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
