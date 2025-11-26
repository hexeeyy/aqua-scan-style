import { useState, useEffect } from "react";
import { Camera, History, Info, Loader2, Volume2, VolumeX, XCircle } from "lucide-react";
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
      <header className="sticky top-0 z-10 glass-effect border-b border-border/50 shadow-md backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-ocean-gradient flex items-center justify-center shadow-md hover:shadow-lg transition-shadow duration-300">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Fish Buddy</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-accent/50" aria-label="View scan history">
              <History className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-accent/50" aria-label="View information">
              <Info className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 pb-24">
        {!showResults ? (
          <>
            {/* Hero Section */}
            <div className="mb-8 rounded-3xl overflow-hidden shadow-xl hover-lift animate-fade-in">
              <div className="relative h-56">
                <img 
                  src={heroImage} 
                  alt="Fresh fish" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                    AI-Powered Fish Analysis
                  </h2>
                  <p className="text-white/95 text-base font-medium">
                    Instant species detection & freshness evaluation
                  </p>
                </div>
              </div>
            </div>

            {/* Scan Button */}
            <div className="mb-8 animate-scale-in">
              <Button
                variant="scan"
                size="lg"
                className="w-full h-20 text-lg rounded-2xl"
                onClick={handleCameraOpen}
                aria-label="Start camera scan to analyze fish"
              >
                <Camera className="w-7 h-7 mr-3" aria-hidden="true" />
                Start Camera Scan
              </Button>
            </div>

            {/* Instructions */}
            <div className="glass-effect rounded-2xl p-6 space-y-3 shadow-md animate-fade-in">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Info className="w-4 h-4 text-primary" />
                </div>
                How to use
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2.5 ml-2 font-medium">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-0.5">1.</span>
                  <span>Tap "Start Camera Scan" to open camera</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-0.5">2.</span>
                  <span>Position the fish clearly in the frame</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-0.5">3.</span>
                  <span>Ensure good lighting conditions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-0.5">4.</span>
                  <span>Tap capture to analyze with AI</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-0.5">5.</span>
                  <span>View instant results and recommendations</span>
                </li>
              </ul>
            </div>
          </>
        ) : results ? (
          <>
            {/* Results Section */}
            <div className="space-y-7" role="region" aria-label="Analysis results">
              <div className="flex items-center justify-between animate-fade-in">
                <h2 className="text-3xl font-bold text-foreground tracking-tight">Scan Results</h2>
                <div className="flex gap-2">
                  {results.isActuallyFish !== false && (
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="rounded-xl"
                      onClick={toggleVoiceNarration}
                      aria-label={isSpeaking ? "Stop voice narration" : "Start voice narration"}
                      aria-pressed={isSpeaking}
                    >
                      {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                  )}
                  <Button variant="ocean" className="rounded-xl" onClick={handleNewScan} aria-label="Start new scan">
                    New Scan
                  </Button>
                </div>
              </div>

              {results.isActuallyFish === false ? (
                <div 
                  className="bg-destructive/10 border-2 border-destructive/50 rounded-2xl p-10 text-center glass-effect animate-scale-in"
                  role="alert"
                  aria-live="polite"
                >
                  <div className="w-16 h-16 rounded-2xl bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-9 h-9 text-destructive" />
                  </div>
                  <h3 className="text-3xl font-bold text-destructive mb-3 tracking-tight">
                    Isda ba yarn???
                  </h3>
                  <p className="text-muted-foreground font-medium text-base">
                    Are you crazy??????? Please capture an image of a fish to analyze its species and freshness.
                  </p>
                </div>
              ) : (
                <>
                  {/* Species Information */}
                  <SpeciesCard {...results.species!} />

                  {/* Price Per Kilo */}
                  {results.pricePerKilo && (
                    <section className="glass-effect rounded-2xl p-7 border border-border/50 shadow-md hover-lift animate-fade-in relative overflow-hidden" aria-labelledby="price-heading">
                      <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
                      <h3 id="price-heading" className="text-xl font-bold text-foreground mb-4 tracking-tight">
                        Current Market Price
                      </h3>
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-bold text-primary tracking-tight" aria-label={`Price range: ${results.pricePerKilo.min*59} to ${results.pricePerKilo.max*59} pesos per kilogram`}>
                     ₱{results.pricePerKilo.min*59} - ₱{results.pricePerKilo.max*59}
                        </span>
                        <span className="text-muted-foreground font-semibold text-lg">per kg</span>
                      </div>
                    </section>
                  )}

                  {/* Freshness Indicator */}
                  <FreshnessIndicator {...results.freshness!} />

                  {/* Quick Stats */}
                  <section aria-labelledby="quality-heading" className="animate-fade-in">
                    <h3 id="quality-heading" className="text-xl font-bold text-foreground mb-4 tracking-tight">
                      Quality Indicators
                    </h3>
                    <QuickStats stats={results.stats!} />
                  </section>

                  {/* AI Reasoning */}
                  <section className="glass-effect rounded-2xl p-7 border border-border/50 shadow-md animate-fade-in" aria-labelledby="analysis-heading">
                    <h3 id="analysis-heading" className="text-xl font-bold text-foreground mb-4 tracking-tight">
                      AI Analysis
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed font-medium">
                      {results.freshness!.reasoning}
                    </p>
                  </section>

                  {/* Recommendations */}
                  <section className="glass-effect rounded-2xl p-7 border border-border/50 shadow-md animate-fade-in" aria-labelledby="recommendations-heading">
                    <h3 id="recommendations-heading" className="text-xl font-bold text-foreground mb-5 tracking-tight">
                      Recommendations
                    </h3>
                    <ul className="space-y-3 text-base text-muted-foreground" role="list">
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
