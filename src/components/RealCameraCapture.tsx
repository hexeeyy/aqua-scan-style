import { useRef, useState, useEffect } from "react";
import { Camera, X, RotateCw, Scan, Fish, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RealCameraCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

interface DetectionResult {
  fishDetected: boolean;
  confidence: number;
  quality: string;
  message: string;
  species: string | null;
  scientificName: string | null;
  freshness: string | null;
}

export const RealCameraCapture = ({ onCapture, onCancel }: RealCameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState<DetectionResult | null>(null);
  const [autoCapture, setAutoCapture] = useState(false);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, [facingMode]);

  useEffect(() => {
    if (stream) {
      startRealtimeDetection();
    }
    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } }
      });
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({ title: "Camera Error", description: "Unable to access camera. Please check permissions.", variant: "destructive" });
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
  };

  const switchCamera = () => setFacingMode(prev => prev === "user" ? "environment" : "user");

  const captureFrameData = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.6);
  };

  const startRealtimeDetection = () => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);

    detectionIntervalRef.current = setInterval(async () => {
      if (isDetecting) return;
      const frameData = captureFrameData();
      if (!frameData) return;

      setIsDetecting(true);
      try {
        const { data, error } = await supabase.functions.invoke('detect-fish', {
          body: { image: frameData }
        });
        if (error) throw error;
        setDetectionStatus(data);

        // Auto-capture if enabled and high confidence
        if (data.fishDetected && data.confidence >= 80 && data.quality === "good" && autoCapture) {
          if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
          captureImage();
        }
      } catch (error) {
        console.error('Detection error:', error);
      } finally {
        setIsDetecting(false);
      }
    }, 2000);
  };

  const captureImage = () => {
    const imageData = captureFrameData();
    if (!imageData) return;
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    stopCamera();
    onCapture(imageData);
  };

  const freshnessColor = (f: string | null) => {
    if (f === "fresh") return "text-emerald-400";
    if (f === "moderate") return "text-amber-400";
    if (f === "poor") return "text-red-400";
    return "text-muted-foreground";
  };

  return (
    <div className="fixed inset-0 z-50 bg-black" role="region" aria-label="Camera capture interface">
      <div className="relative w-full h-full bg-black">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Top controls */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-20">
          <Button variant="ghost" size="icon" className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>

          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm" className="bg-black/50 text-white hover:bg-black/70 text-[10px] px-2.5 backdrop-blur-sm" onClick={() => setAutoCapture(!autoCapture)}>
              {autoCapture ? "Auto" : "Manual"}
            </Button>
            <Button variant="ghost" size="icon" className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm" onClick={switchCamera}>
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Live species overlay - top center */}
        {detectionStatus && (
          <div className="absolute top-14 left-3 right-3 z-20">
            <div className={`rounded-xl backdrop-blur-md border p-2.5 transition-all duration-300 ${
              detectionStatus.fishDetected 
                ? 'bg-primary/20 border-primary/40' 
                : 'bg-black/40 border-white/10'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isDetecting ? (
                    <Scan className="w-4 h-4 text-primary animate-pulse" />
                  ) : detectionStatus.fishDetected ? (
                    <Fish className="w-4 h-4 text-primary" />
                  ) : (
                    <Scan className="w-4 h-4 text-white/50" />
                  )}
                  <div>
                    <p className="text-white text-xs font-bold leading-tight">
                      {detectionStatus.species || detectionStatus.message}
                    </p>
                    {detectionStatus.scientificName && (
                      <p className="text-white/60 text-[9px] italic">{detectionStatus.scientificName}</p>
                    )}
                  </div>
                </div>

                {detectionStatus.fishDetected && (
                  <div className="flex items-center gap-2">
                    {/* Freshness badge */}
                    {detectionStatus.freshness && detectionStatus.freshness !== "unknown" && (
                      <div className="flex items-center gap-1">
                        <Droplets className={`w-3 h-3 ${freshnessColor(detectionStatus.freshness)}`} />
                        <span className={`text-[10px] font-semibold capitalize ${freshnessColor(detectionStatus.freshness)}`}>
                          {detectionStatus.freshness}
                        </span>
                      </div>
                    )}
                    {/* Confidence */}
                    <div className="bg-white/20 px-2 py-0.5 rounded-full">
                      <span className="text-white text-[10px] font-bold">{detectionStatus.confidence}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confidence bar */}
              {detectionStatus.fishDetected && (
                <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-primary"
                    style={{ width: `${detectionStatus.confidence}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scan frame overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className={`w-[85%] h-[65%] relative transition-all duration-500 ${
            detectionStatus?.fishDetected ? '' : ''
          }`}>
            {/* Corner brackets */}
            {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((pos, i) => (
              <div
                key={i}
                className={`absolute w-8 h-8 ${pos} rounded-sm transition-colors duration-300 ${
                  detectionStatus?.fishDetected ? 'border-primary' : 'border-white/30'
                }`}
              />
            ))}

            {/* Center guidance when no fish */}
            {!detectionStatus?.fishDetected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                  <p className="text-white/70 text-[10px] font-medium text-center">
                    Position fish within frame
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom capture button */}
        <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2 z-20">
          {detectionStatus?.fishDetected && !detectionStatus.species && (
            <p className="text-white/60 text-[10px]">Identifying species...</p>
          )}
          <Button 
            variant="scan" 
            size="lg" 
            className="rounded-full w-16 h-16 shadow-glow"
            onClick={captureImage}
            aria-label="Capture image for full analysis"
          >
            <Camera className="w-6 h-6" />
          </Button>
          <p className="text-white/50 text-[9px]">Tap to capture for detailed analysis</p>
        </div>
      </div>
    </div>
  );
};