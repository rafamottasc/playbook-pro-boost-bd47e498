import { useEffect, useRef } from "react";
import { convertYouTubeUrl } from "@/lib/youtube";

interface VideoPlayerProps {
  videoUrl: string;
  onComplete?: () => void;
  onProgress?: (percentage: number) => void;
}

export function VideoPlayer({ videoUrl, onComplete, onProgress }: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const embedUrl = convertYouTubeUrl(videoUrl);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const initializePlayer = () => {
      if (!iframeRef.current) return;

      // @ts-ignore
      playerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onStateChange: (event: any) => {
            // 0 = ended, 1 = playing, 2 = paused
            if (event.data === 0) {
              // Video ended
              if (onComplete) onComplete();
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
              }
            } else if (event.data === 1) {
              // Video playing - start progress tracking
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
              }
              
              progressIntervalRef.current = setInterval(() => {
                if (playerRef.current && onProgress) {
                  const currentTime = playerRef.current.getCurrentTime();
                  const duration = playerRef.current.getDuration();
                  if (duration > 0) {
                    const percentage = Math.floor((currentTime / duration) * 100);
                    onProgress(percentage);
                  }
                }
              }, 1000); // Update every second for better accuracy
            } else if (event.data === 2) {
              // Video paused - stop progress tracking
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
              }
            }
          }
        }
      });
    };

    // Load YouTube API if not already loaded
    // @ts-ignore
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      // @ts-ignore
      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      // API already loaded, initialize player directly
      initializePlayer();
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoUrl, onComplete, onProgress]);

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
      <iframe
        ref={iframeRef}
        src={`${embedUrl}?enablejsapi=1`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
