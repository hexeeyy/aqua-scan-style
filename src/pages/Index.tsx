import { useState, useEffect } from "react";
import { Camera, History, Info, Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RealCameraCapture } from "@/components/RealCameraCapture";
import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import { SpeciesCard } from "@/components/SpeciesCard";
import { QuickStats } from "@/components/QuickStats";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/1.jpg";

type FreshnessLevel = "fresh" | "moderate" | "poor";

interface AnalysisResult {
  isActuallyFish: boolean;
  message?: string;
  species?: {
    name: string;
    scientificName: string;
    confidence: number;
  };
  freshness?: {
    level: FreshnessLevel;
    score: number;
    reasoning: string;
  };
  stats?: {
    eyeClarity: string;
    gillColor: string;
    texture: string;
  };
  pricePerKilo?: {
    min: number;
    max: number;
    currency: string;
  };
}

const Index = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCameraOpen = () => {
    setShowCamera(true);
  };

  const handleCameraCancel = () => {
    setShowCamera(false);
  };

  const handleCapture = async (imageData: string) => {
    setShowCamera(false);
    setIsAnalyzing(true);

    try {
      console.log("Sending image for analysis...");
      
      const { data, error } = await supabase.functions.invoke('analyze-fish', {
        body: { image: imageData }
      });

      if (error) {
        console.error("Analysis error:", error);
        throw error;
      }

      if (!data) {
        throw new Error("No data returned from analysis");
      }

      console.log("Analysis result:", data);
      setResults(data as AnalysisResult);
      setShowResults(true);
      
      if (data.isActuallyFish === false) {
        toast({
          title: "Not a Fish",
          description: "This is not a fish. Please capture an image of a fish.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Analysis Complete",
          description: `Detected ${data.species.name} with ${data.species.confidence}% confidence`,
        });
      }

    } catch (error) {
      console.error("Error analyzing fish:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNewScan = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setShowResults(false);
    setResults(null);
  };

  const toggleVoiceNarration = () => {
    if (!results || results.isActuallyFish === false) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const text = `Analysis results for ${results.species?.name}. 
      Confidence: ${results.species?.confidence}%. 
      Freshness level: ${results.freshness?.level}. 
      Score: ${results.freshness?.score} out of 100. 
      ${results.freshness?.reasoning}. 
      Current market price: ${results.pricePerKilo?.min ? `${results.pricePerKilo.min * 59} to ${results.pricePerKilo.max * 59} pesos per kilogram` : 'not available'}.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Analyzing Fish</h2>
            <p className="text-muted-foreground">Wait lang mga bro, kami na bahala kung fresh ba yan... eyyy</p>
          </div>
        </div>
      </div>
    );
  }

  if (showCamera) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <RealCameraCapture 
            onCapture={handleCapture}
            onCancel={handleCameraCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-ocean-gradient flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Fish Buddy</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" aria-label="View scan history">
              <History className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="View information">
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

            {/* Scan Button */}
            <div className="mb-6">
              <Button
                variant="scan"
                size="lg"
                className="w-full h-16 text-lg"
                onClick={handleCameraOpen}
                aria-label="Start camera scan to analyze fish"
              >
                <Camera className="w-6 h-6 mr-2" aria-hidden="true" />
                Start Camera Scan
              </Button>
            </div>

            {/* Instructions */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                How to use
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Tap "Start Camera Scan" to open camera</li>
                <li>• Position the fish clearly in the frame</li>
                <li>• Ensure good lighting conditions</li>
                <li>• Tap capture to analyze with AI</li>
                <li>• View instant results and recommendations</li>
              </ul>
            </div>
          </>
        ) : results ? (
          <>
            {/* Results Section */}
            <div className="space-y-6" role="region" aria-label="Analysis results">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Scan Results</h2>
                <div className="flex gap-2">
                  {results.isActuallyFish !== false && (
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={toggleVoiceNarration}
                      aria-label={isSpeaking ? "Stop voice narration" : "Start voice narration"}
                      aria-pressed={isSpeaking}
                    >
                      {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                  )}
                  <Button variant="ocean" onClick={handleNewScan} aria-label="Start new scan">
                    New Scan
                  </Button>
                </div>
              </div>

              {results.isActuallyFish === false ? (
                <div 
                  className="bg-destructive/10 border border-destructive rounded-xl p-8 text-center"
                  role="alert"
                  aria-live="polite"
                >
                  <h3 className="text-2xl font-bold text-destructive mb-2">
                    Isda ba yarn???
                  </h3>
                  <p className="text-muted-foreground">
                    Are you crazy??????? Please capture an image of a fish to analyze its species and freshness.
                  </p>
                </div>
              ) : (
                <>
                  {/* Species Information */}
                  <SpeciesCard {...results.species!} />

                  {/* Price Per Kilo */}
                  {results.pricePerKilo && (
                    <section className="bg-card rounded-xl p-6 border border-border shadow-sm" aria-labelledby="price-heading">
                      <h3 id="price-heading" className="text-lg font-semibold text-foreground mb-3">
                        Current Market Price
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-primary" aria-label={`Price range: ${results.pricePerKilo.min*59} to ${results.pricePerKilo.max*59} pesos per kilogram`}>
                     ₱{results.pricePerKilo.min*59} - ₱{results.pricePerKilo.max*59}
                        </span>
                        <span className="text-muted-foreground">per kg</span>
                      </div>
                    </section>
                  )}

                  {/* Freshness Indicator */}
                  <FreshnessIndicator {...results.freshness!} />

                  {/* Quick Stats */}
                  <section aria-labelledby="quality-heading">
                    <h3 id="quality-heading" className="text-lg font-semibold text-foreground mb-3">
                      Quality Indicators
                    </h3>
                    <QuickStats stats={results.stats!} />
                  </section>

                  {/* AI Reasoning */}
                  <section className="bg-card rounded-xl p-6 border border-border shadow-sm" aria-labelledby="analysis-heading">
                    <h3 id="analysis-heading" className="text-lg font-semibold text-foreground mb-3">
                      AI Analysis
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {results.freshness!.reasoning}
                    </p>
                  </section>

                  {/* Recommendations */}
                  <section className="bg-card rounded-xl p-6 border border-border shadow-sm" aria-labelledby="recommendations-heading">
                    <h3 id="recommendations-heading" className="text-lg font-semibold text-foreground mb-3">
                      Recommendations
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground" role="list">
                      {results.freshness!.level === "fresh" && (
                    <>
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
                    </>
                  )}
                  {results.freshness!.level === "moderate" && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-warning mt-0.5">⚠</span>
                        <span>Cook thoroughly before consumption</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-warning mt-0.5">⚠</span>
                        <span>Consume within 12-24 hours</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-warning mt-0.5">⚠</span>
                        <span>Keep refrigerated at all times</span>
                      </li>
                    </>
                  )}
                  {results.freshness!.level === "poor" && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-0.5">✗</span>
                        <span>Not recommended for consumption</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-0.5">✗</span>
                        <span>Dispose of safely</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-0.5">✗</span>
                        <span>Check storage conditions</span>
                      </li>
                    </>
                      )}
                    </ul>
                  </section>
                </>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
};

export default Index;
