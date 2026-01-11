import os
from typing import Optional
from fastapi import APIRouter, HTTPException, status, BackgroundTasks

from models.video import Video, VideoCreate, VideoUpdate, VideoList, VideoStatus, ProcessingResult
from services.firebase_client import VideoRepository, get_signed_url, download_video_to_temp
from services.transcription import transcribe_video
from services.ai_tagger import generate_title_and_tags_safe

router = APIRouter(prefix="/videos", tags=["videos"])


def get_repo() -> VideoRepository:
    return VideoRepository()


async def process_video_task(video_id: str):
    """Background task to process a video."""
    repo = get_repo()

    try:
        # Get video record
        video = await repo.get(video_id)
        if not video:
            print(f"Video {video_id} not found")
            return

        # Update status to processing
        await repo.update(video_id, VideoUpdate(status=VideoStatus.PROCESSING))

        # Download video from storage
        print(f"Downloading video {video_id}...")
        video_path = download_video_to_temp(video.storage_path)

        try:
            # Transcribe
            print(f"Transcribing video {video_id}...")
            transcript = transcribe_video(video_path)

            # Generate title and tags
            print(f"Generating tags for video {video_id}...")
            result = generate_title_and_tags_safe(transcript)

            # Update video record
            await repo.update(
                video_id,
                VideoUpdate(
                    title=result.title,
                    tags=result.tags,
                    transcript=transcript,
                    status=VideoStatus.READY,
                ),
            )
            print(f"Video {video_id} processed successfully")

        finally:
            # Cleanup temp file
            if os.path.exists(video_path):
                os.remove(video_path)

    except Exception as e:
        print(f"Error processing video {video_id}: {e}")
        await repo.update(video_id, VideoUpdate(status=VideoStatus.FAILED))


@router.get("", response_model=VideoList)
async def list_videos(
    status: Optional[VideoStatus] = None,
    tag: Optional[str] = None,
    limit: int = 50,
):
    """List all videos, optionally filtered by status or tag."""
    repo = get_repo()
    videos = await repo.list_all(status_filter=status, tag_filter=tag, limit=limit)

    # Add signed URLs for each video
    for video in videos:
        try:
            video.storage_url = get_signed_url(video.storage_path)
        except Exception:
            pass

    return VideoList(videos=videos, total=len(videos))


@router.get("/tags")
async def list_tags():
    """Get all unique tags."""
    repo = get_repo()
    tags = await repo.get_all_tags()
    return {"tags": tags}


@router.get("/{video_id}", response_model=Video)
async def get_video(video_id: str):
    """Get a single video by ID."""
    repo = get_repo()
    video = await repo.get(video_id)

    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

    # Add signed URL
    try:
        video.storage_url = get_signed_url(video.storage_path, expiration_minutes=120)
    except Exception:
        pass

    return video


@router.post("", response_model=Video, status_code=status.HTTP_201_CREATED)
async def create_video(video: VideoCreate):
    """Create a new video record (after upload to Firebase Storage)."""
    repo = get_repo()
    return await repo.create(video)


@router.post("/{video_id}/process", response_model=dict)
async def process_video(video_id: str, background_tasks: BackgroundTasks):
    """Trigger AI processing for a video (transcription + tagging)."""
    repo = get_repo()
    video = await repo.get(video_id)

    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

    if video.status == VideoStatus.PROCESSING:
        return {"message": "Video is already being processed", "status": video.status}

    # Start background processing
    background_tasks.add_task(process_video_task, video_id)

    return {"message": "Processing started", "video_id": video_id, "status": "processing"}


@router.delete("/{video_id}")
async def delete_video(video_id: str):
    """Delete a video and its storage file."""
    repo = get_repo()
    deleted = await repo.delete(video_id)

    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

    return {"message": "Video deleted", "video_id": video_id}
