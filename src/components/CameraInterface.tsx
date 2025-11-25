import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CameraInterfaceProps {
  onCapture: () => void;
}

export const CameraInterface = ({ onCapture }: CameraInterfaceProps) => {
  return (
    <Card className="relative overflow-hidden bg-card border-none shadow-lg">
      <div className="aspect-[4/3] bg-muted flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="mx-auto w-20 h-20 rounded-full bg-ocean-gradient flex items-center justify-center">
            <Camera className="w-10 h-10 text-white" />
          </div>
          <p className="text-muted-foreground text-sm">
            Position fish in frame and tap to scan
          </p>
        </div>
      </div>
      
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <Button 
          variant="scan" 
          size="lg" 
          className="rounded-full w-16 h-16"
          onClick={onCapture}
        >
          <Camera className="w-6 h-6" />
        </Button>
      </div>
    </Card>
  );
};
