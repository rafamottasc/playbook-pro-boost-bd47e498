import { useEffect, useRef } from "react";
import { convertYouTubeUrl } from "@/lib/youtube";

interface VideoPlayerProps {
  videoUrl: string;
  onComplete?: () => void;
}

export function VideoPlayer({ videoUrl, onComplete }: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const embedUrl = convertYouTubeUrl(videoUrl);

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
            // 0 = ended
            if (event.data === 0 && onComplete) {
              onComplete();
            }
          }
        }
      });
    };
  }, [onComplete]);

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
