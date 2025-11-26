import { useRef, useState, useEffect } from "react";
import { Camera, X, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface RealCameraCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

export const RealCameraCapture = ({ onCapture, onCancel }: RealCameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const { toast } = useToast();

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 300 },
          height: { ideal: 400 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    stopCamera();
    onCapture(imageData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black md:relative md:rounded-lg md:overflow-hidden" role="region" aria-label="Camera capture interface">
      <div className="relative w-full h-full md:aspect-[4/3] bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          aria-label="Live camera feed"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Camera controls overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/50 text-white hover:bg-black/70"
            onClick={onCancel}
            aria-label="Cancel camera capture"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/50 text-white hover:bg-black/70"
            onClick={switchCamera}
            aria-label="Switch between front and back camera"
          >
            <RotateCw className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>

        {/* Capture guide overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[85%] h-[70%] border-4 border-dashed border-primary/50 rounded-2xl relative animate-pulse">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded-lg backdrop-blur-sm">
              <p className="text-white text-sm font-medium text-center">
                Position fish clearly in frame
              </p>
            </div>
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded-lg backdrop-blur-sm">
              <p className="text-white text-xs text-center">
                Ensure good lighting and full fish visibility
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-8 md:bottom-6 left-0 right-0 flex justify-center">
        <Button 
          variant="scan" 
          size="lg" 
          className="rounded-full w-16 h-16 shadow-glow"
          onClick={captureImage}
          aria-label="Capture image for fish analysis"
        >
          <Camera className="w-6 h-6" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};
