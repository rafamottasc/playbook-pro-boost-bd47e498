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

  useEffect(() => {
    // YouTube Player API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // @ts-ignore
    window.onYouTubeIframeAPIReady = () => {
      // @ts-ignore
      const player = new window.YT.Player(iframeRef.current, {
        events: {
          onStateChange: (event: any) => {
            // 0 = ended, 1 = playing
            if (event.data === 0 && onComplete) {
              onComplete();
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
              }
            } else if (event.data === 1 && onProgress) {
              // Start tracking progress when playing
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
              }
              progressIntervalRef.current = setInterval(() => {
                const currentTime = player.getCurrentTime();
                const duration = player.getDuration();
                if (duration > 0) {
                  const percentage = Math.floor((currentTime / duration) * 100);
                  onProgress(percentage);
                }
              }, 2000); // Update every 2 seconds
            } else if (event.data === 2) {
              // Paused
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
              }
            }
          }
        }
      });
    };

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [onComplete, onProgress]);

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
