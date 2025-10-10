import { convertYouTubeUrl } from "@/lib/youtube";

interface VideoPlayerProps {
  videoUrl: string;
  onComplete?: () => void;
  onProgress?: (percentage: number) => void;
}

export function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  const embedUrl = convertYouTubeUrl(videoUrl);

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
      <iframe
        src={embedUrl}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
}
