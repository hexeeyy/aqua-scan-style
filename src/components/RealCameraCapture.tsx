import { useRef, useState, useEffect } from "react";
import { Camera, X, RotateCw, Scan, Fish, Droplets, Target, RotateCcw } from "lucide-react";
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
  const [rotation, setRotation] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState<DetectionResult | null>(null);
  const [autoCapture, setAutoCapture] = useState(false);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Enumerate available video devices for robust switching
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceIdx, setActiveDeviceIdx] = useState(0);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(all => {
      const cams = all.filter(d => d.kind === "videoinput");
      setDevices(cams);
    });
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, [facingMode, activeDeviceIdx]);

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
      // Prefer exact deviceId when available, fall back to facingMode
      const constraints: MediaStreamConstraints = devices.length > 0
        ? { video: { deviceId: { exact: devices[activeDeviceIdx]?.deviceId }, width: { ideal: 640 }, height: { ideal: 480 } } }
        : { video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } } };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
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

  const switchCamera = () => {
    if (devices.length > 1) {
      setActiveDeviceIdx(prev => (prev + 1) % devices.length);
    } else {
      setFacingMode(prev => prev === "user" ? "environment" : "user");
    }
    // Reset rotation when switching cameras
    setRotation(0);
  };

  const rotateCamera = () => setRotation(prev => (prev + 90) % 360);

  const captureFrameData = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const isRotated90 = rotation === 90 || rotation === 270;
    canvas.width = isRotated90 ? video.videoHeight : video.videoWidth;
    canvas.height = isRotated90 ? video.videoWidth : video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(video, -video.videoWidth / 2, -video.videoHeight / 2);
    ctx.restore();
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

  const fishDetected = detectionStatus?.fishDetected;
  const confidence = detectionStatus?.confidence ?? 0;

  return (
    <div className="fixed inset-0 z-50 bg-black" role="region" aria-label="Camera capture interface">
      <div className="relative w-full h-full bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={{
            transform: `rotate(${rotation}deg) translateZ(0)`,
            // Scale up at 90/270 so rotated video still fills the viewport
            ...(rotation === 90 || rotation === 270
              ? { transformOrigin: 'center center', scale: `${Math.max(window.innerWidth / window.innerHeight, window.innerHeight / window.innerWidth)}` }
              : {}),
            transition: 'transform 0.3s ease',
          }}
        />
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
            <Button variant="ghost" size="icon" className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm relative" onClick={rotateCamera} aria-label={`Rotate camera (${rotation}°)`}>
              <RotateCcw className="w-4 h-4" />
              {rotation !== 0 && (
                <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[8px] font-bold px-1 py-0.5 rounded-full min-w-[20px] text-center leading-none">
                  {rotation}°
                </span>
              )}
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
              fishDetected 
                ? 'bg-primary/20 border-primary/40' 
                : 'bg-black/40 border-white/10'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isDetecting ? (
                    <Scan className="w-4 h-4 text-primary animate-pulse" />
                  ) : fishDetected ? (
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

                {fishDetected && (
                  <div className="flex items-center gap-2">
                    {detectionStatus.freshness && detectionStatus.freshness !== "unknown" && (
                      <div className="flex items-center gap-1">
                        <Droplets className={`w-3 h-3 ${freshnessColor(detectionStatus.freshness)}`} />
                        <span className={`text-[10px] font-semibold capitalize ${freshnessColor(detectionStatus.freshness)}`}>
                          {detectionStatus.freshness}
                        </span>
                      </div>
                    )}
                    <div className="bg-white/20 px-2 py-0.5 rounded-full">
                      <span className="text-white text-[10px] font-bold">{confidence}%</span>
                    </div>
                  </div>
                )}
              </div>

              {fishDetected && (
                <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-primary"
                    style={{ width: `${confidence}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== BOUNDING BOX OVERLAY ===== */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className={`relative transition-all duration-500 ease-out ${
            fishDetected 
              ? 'w-[70%] h-[60%]' 
              : 'w-[85%] h-[65%]'
          }`}>
            {/* Animated bounding box border when fish detected */}
            {fishDetected && (
              <>
                {/* Main bounding box */}
                <div className="absolute inset-0 border-2 border-primary rounded-lg animate-bbox-pulse" />

                {/* Scanning line */}
                <div className="absolute left-1 right-1 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line opacity-60" />

                {/* Detection label */}
                <div className="absolute -top-7 left-0 flex items-center gap-1.5">
                  <div className="bg-primary px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Target className="w-3 h-3 text-primary-foreground" />
                    <span className="text-[10px] font-bold text-primary-foreground tracking-wide uppercase">
                      {detectionStatus?.species || "Fish Detected"}
                    </span>
                  </div>
                  <span className="text-primary text-[10px] font-bold">{confidence}%</span>
                </div>

                {/* Confidence bar under bbox */}
                <div className="absolute -bottom-4 left-0 right-0 h-1.5 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${confidence}%` }} 
                  />
                </div>
              </>
            )}

            {/* Corner brackets (always visible, color changes) */}
            {[
              'top-0 left-0 border-t-2 border-l-2 rounded-tl-lg',
              'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg',
              'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg',
              'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg'
            ].map((pos, i) => (
              <div
                key={i}
                className={`absolute w-10 h-10 ${pos} transition-all duration-500 ${
                  fishDetected 
                    ? 'border-primary shadow-[0_0_10px_hsla(204,100%,61%,0.5)]' 
                    : 'border-white/30'
                }`}
              />
            ))}

            {/* Crosshair in center when no fish */}
            {!fishDetected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-6 h-[1px] bg-white/20 absolute top-1/2 left-1/2 -translate-x-1/2" />
                  <div className="w-[1px] h-6 bg-white/20 absolute top-1/2 left-1/2 -translate-y-1/2" />
                </div>
                <div className="absolute bottom-4 bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">
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
          {fishDetected && !detectionStatus?.species && (
            <p className="text-white/60 text-[10px]">Identifying species...</p>
          )}
          <Button 
            variant="scan" 
            size="lg" 
            className={`rounded-full w-16 h-16 transition-all duration-300 ${
              fishDetected ? 'shadow-glow ring-2 ring-primary/50 ring-offset-2 ring-offset-black' : ''
            }`}
            onClick={captureImage}
            aria-label="Capture image for full analysis"
          >
            <Camera className="w-6 h-6" />
          </Button>
          <p className="text-white/50 text-[9px]">
            {fishDetected ? "Fish detected — tap to analyze" : "Tap to capture for detailed analysis"}
          </p>
        </div>
      </div>
    </div>
  );
};
