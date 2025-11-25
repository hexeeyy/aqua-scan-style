import { useState } from "react";
import { Camera, History, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CameraInterface } from "@/components/CameraInterface";
import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import { SpeciesCard } from "@/components/SpeciesCard";
import { QuickStats } from "@/components/QuickStats";
import heroImage from "@/assets/hero-fish.jpg";

const Index = () => {
  const [showResults, setShowResults] = useState(false);

  // Mock data for demonstration
  const mockResults = {
    species: {
      name: "Atlantic Salmon",
      scientificName: "Salmo salar",
      confidence: 94
    },
    freshness: {
      level: "fresh" as const,
      score: 92
    },
    stats: {
      eyeClarity: "Clear",
      gillColor: "Bright Red",
      texture: "Firm"
    }
  };

  const handleCapture = () => {
    // Simulate scanning
    setTimeout(() => {
      setShowResults(true);
    }, 1500);
  };

  const handleNewScan = () => {
    setShowResults(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-ocean-gradient flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">FreshCatch</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <History className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Info className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-20">
        {!showResults ? (
          <>
            {/* Hero Section */}
            <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
              <div className="relative h-48">
                <img 
                  src={heroImage} 
                  alt="Fresh fish" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-2xl font-bold text-white mb-1">
                    AI-Powered Fish Analysis
                  </h2>
                  <p className="text-white/90 text-sm">
                    Instant species detection & freshness evaluation
                  </p>
                </div>
              </div>
            </div>

            {/* Camera Interface */}
            <div className="mb-6">
              <CameraInterface onCapture={handleCapture} />
            </div>

            {/* Instructions */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                How to use
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Position the fish clearly in the frame</li>
                <li>• Ensure good lighting conditions</li>
                <li>• Tap the camera button to scan</li>
                <li>• View instant results and recommendations</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            {/* Results Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Scan Results</h2>
                <Button variant="ocean" onClick={handleNewScan}>
                  New Scan
                </Button>
              </div>

              {/* Species Information */}
              <SpeciesCard {...mockResults.species} />

              {/* Freshness Indicator */}
              <FreshnessIndicator {...mockResults.freshness} />

              {/* Quick Stats */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Quality Indicators
                </h3>
                <QuickStats stats={mockResults.stats} />
              </div>

              {/* Recommendations */}
              <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Recommendations
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-0.5">✓</span>
                    <span>Suitable for raw consumption (sushi/sashimi)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-0.5">✓</span>
                    <span>Best consumed within 24-48 hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-0.5">✓</span>
                    <span>Store at 32-39°F (0-4°C)</span>
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
