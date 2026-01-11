import os
import json
import google.generativeai as genai
from typing import Optional

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


TAGGING_PROMPT = """You are analyzing a personal video journal transcript.
Based on the vibe, emotions, and content of this entry, generate:

1. A short title (1-5 words) that captures the essence/mood of the entry
2. 2-5 relevant tags that describe the themes, emotions, or topics

The title should feel personal and capture the "vibe" - not just summarize the content.
Tags should be lowercase, single words or short phrases.

Transcript:
{transcript}

Respond ONLY with valid JSON in this exact format:
{{"title": "Your Title Here", "tags": ["tag1", "tag2", "tag3"]}}"""


class TaggingResult:
    def __init__(self, title: str, tags: list[str]):
        self.title = title
        self.tags = tags


def generate_title_and_tags(transcript: str) -> TaggingResult:
    """Use Gemini Flash to generate a title and tags from transcript."""
    if not transcript or not transcript.strip():
        return TaggingResult(title="Untitled Entry", tags=["unprocessed"])

    model = genai.GenerativeModel("gemini-2.0-flash-exp")

    prompt = TAGGING_PROMPT.format(transcript=transcript[:8000])  # Limit transcript length

    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                max_output_tokens=200,
            ),
        )

        # Parse JSON response
        text = response.text.strip()

        # Handle potential markdown code blocks
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1])

        result = json.loads(text)

        title = result.get("title", "Untitled Entry")
        tags = result.get("tags", [])

        # Validate and clean tags
        tags = [str(tag).lower().strip() for tag in tags if tag]
        tags = tags[:5]  # Max 5 tags

        # Validate title
        if not title or len(title) > 50:
            title = "Untitled Entry"

        return TaggingResult(title=title, tags=tags)

    except json.JSONDecodeError:
        # If JSON parsing fails, try to extract manually
        return TaggingResult(title="Processing Error", tags=["error"])
    except Exception as e:
        print(f"Gemini API error: {e}")
        return TaggingResult(title="Processing Error", tags=["error"])


def generate_title_and_tags_safe(transcript: str) -> TaggingResult:
    """Safe wrapper that never throws."""
    try:
        return generate_title_and_tags(transcript)
    except Exception:
        return TaggingResult(title="Untitled Entry", tags=["unprocessed"])
