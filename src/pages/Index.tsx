import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, History, Info, Loader2, Volume2, VolumeX, XCircle, MapPin, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RealCameraCapture } from "@/components/RealCameraCapture";
import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import { SpeciesCard } from "@/components/SpeciesCard";
import { QuickStats } from "@/components/QuickStats";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero.png";
import Logo from "@/assets/logo.png";
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ScanHistory, saveScanToHistory, type ScanRecord } from "@/components/ScanHistory";

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
    source?: string;
  };
  habitat?: string;
  nutritionalInfo?: {
    protein: number;
    omega3: string;
    calories: number;
  };
  commonAreas?: string[];
}

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
}

const Index = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

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
    setCapturedImage(imageData);
    setIsAnalyzing(true);

    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: Date.now()
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }

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
      const analysisData = data as AnalysisResult;
      setResults(analysisData);
      setShowResults(true);
      
      if (analysisData.isActuallyFish === false) {
        toast({
          title: "Not a Fish",
          description: "This is not a fish. Please capture an image of a fish.",
          variant: "destructive",
        });
      } else {
        // Save to scan history
        if (analysisData.species && analysisData.freshness) {
          const record: ScanRecord = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            thumbnail: imageData,
            species: analysisData.species,
            freshness: analysisData.freshness,
            pricePerKilo: analysisData.pricePerKilo,
            nutritionalInfo: analysisData.nutritionalInfo,
            stats: analysisData.stats,
          };
          saveScanToHistory(record);
        }
        toast({
          title: "Analysis Complete",
          description: `Detected ${analysisData.species?.name} with ${analysisData.species?.confidence}% confidence`,
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
    setCapturedImage(null);
  };

  if (showHistory) {
    return <ScanHistory onBack={() => setShowHistory(false)} />;
  }

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
      Current market price: ${results.pricePerKilo?.min ? `${results.pricePerKilo.min} to ${results.pricePerKilo.max} pesos per kilogram` : 'not available'}.`;

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
            <p className="text-muted-foreground">Please wait while we analyze the fish image...</p>
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
      {/* Header - compact for landscape 7" tablet */}
      <header className="sticky top-0 z-10 glass-effect border-b border-border/50 shadow-md backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={Logo} alt="SARI-ONE Logo" className="w-7 h-7" />
            <h1 className="text-base font-bold text-foreground tracking-tight">SARI-ONE</h1>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-accent/50 w-8 h-8" aria-label="Toggle fullscreen" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-accent/50 w-8 h-8" aria-label="View scan history" onClick={() => setShowHistory(true)}>
              <History className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-accent/50 w-8 h-8" aria-label="View information">
              <Info className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 py-2 pb-4">
        {!showResults ? (
          <>
            {/* Hero + Scan in landscape side-by-side */}
            <div className="grid grid-cols-2 gap-3 mb-3 animate-fade-in">
              {/* Hero Section */}
              <div className="rounded-2xl overflow-hidden shadow-xl hover-lift">
                <div className="relative h-full min-h-[140px]">
                  <img 
                    src={heroImage} 
                    alt="Fresh fish" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h2 className="text-lg font-bold text-white mb-0.5 tracking-tight">
                      AI Fish Analysis
                    </h2>
                    <p className="text-white/95 text-xs font-medium">
                      Know the Species. Check the Freshness.
                    </p>
                  </div>
                </div>
              </div>

              {/* Scan Button + Quick Instructions */}
              <div className="flex flex-col gap-2">
                <Button
                  variant="scan"
                  size="lg"
                  className="w-full h-14 text-sm rounded-2xl flex-shrink-0"
                  onClick={handleCameraOpen}
                  aria-label="Start camera scan to analyze fish"
                >
                  <Camera className="w-5 h-5 mr-2" aria-hidden="true" />
                  Start Camera Scan
                </Button>

                <div className="glass-effect rounded-2xl p-3 space-y-1.5 shadow-md flex-1 overflow-auto">
                  <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                      <Info className="w-3 h-3 text-primary" />
                    </div>
                    How to use
                  </h3>
                  <ul className="text-[11px] text-muted-foreground space-y-0.5 ml-1 font-medium">
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary font-bold">1.</span>
                      <span>Tap "Start Camera Scan"</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary font-bold">2.</span>
                      <span>Position fish clearly in frame</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary font-bold">3.</span>
                      <span>Ensure good lighting</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary font-bold">4.</span>
                      <span>Capture & view AI results</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        ) : results ? (
          <>
            {/* Results Section - landscape 2-column grid */}
            <div role="region" aria-label="Analysis results">
              <div className="flex items-center justify-between animate-fade-in mb-2">
                <h2 className="text-lg font-bold text-foreground tracking-tight">Scan Results</h2>
                <div className="flex gap-1.5">
                  {results.isActuallyFish !== false && (
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="rounded-xl w-8 h-8"
                      onClick={toggleVoiceNarration}
                      aria-label={isSpeaking ? "Stop voice narration" : "Start voice narration"}
                      aria-pressed={isSpeaking}
                    >
                      {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                  )}
                  <Button variant="ocean" size="sm" className="rounded-xl text-xs" onClick={handleNewScan} aria-label="Start new scan">
                    New Scan
                  </Button>
                </div>
              </div>

              {results.isActuallyFish === false ? (
                <div 
                  className="bg-destructive/10 border-2 border-destructive/50 rounded-2xl p-6 text-center glass-effect animate-scale-in"
                  role="alert"
                  aria-live="polite"
                >
                  <div className="w-12 h-12 rounded-2xl bg-destructive/20 flex items-center justify-center mx-auto mb-3">
                    <XCircle className="w-7 h-7 text-destructive" />
                  </div>
                  <h3 className="text-xl font-bold text-destructive mb-2 tracking-tight">Not a Fish!</h3>
                  <p className="text-muted-foreground font-medium text-sm">
                    The image does not appear to be a fish. Please try again.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Left column */}
                  <div className="space-y-2.5">
                    {/* Species Information */}
                    <SpeciesCard {...results.species!} />

                    {/* Price Per Kilo */}
                    {results.pricePerKilo && (
                      <section className="glass-effect rounded-xl p-3 border border-border/50 shadow-md animate-fade-in relative overflow-hidden" aria-labelledby="price-heading">
                        <h3 id="price-heading" className="text-sm font-bold text-foreground mb-2 tracking-tight">
                          Market Price (PH)
                        </h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-primary tracking-tight">
                            ₱{results.pricePerKilo.min.toLocaleString()} - ₱{results.pricePerKilo.max.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground font-semibold text-xs">per kg</span>
                        </div>
                      </section>
                    )}

                    {/* Freshness Score Chart */}
                    {results.freshness && (
                      <section className="glass-effect rounded-xl p-3 border border-border/50 shadow-md animate-fade-in" aria-labelledby="freshness-chart-heading">
                        <h3 id="freshness-chart-heading" className="text-sm font-bold text-foreground mb-1 tracking-tight">
                          Freshness Score
                        </h3>
                        <div className="h-28">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart 
                              cx="50%" 
                              cy="50%" 
                              innerRadius="60%" 
                              outerRadius="100%" 
                              data={[{ name: 'Freshness', value: results.freshness.score, fill: 'hsl(var(--primary))' }]}
                              startAngle={90}
                              endAngle={-270}
                            >
                              <RadialBar
                                background
                                dataKey="value"
                                cornerRadius={10}
                              />
                              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-primary">
                                {results.freshness.score}%
                              </text>
                            </RadialBarChart>
                          </ResponsiveContainer>
                        </div>
                      </section>
                    )}

                    {/* Freshness Indicator */}
                    <FreshnessIndicator {...results.freshness!} />
                  </div>

                  {/* Right column */}
                  <div className="space-y-2.5">
                    {/* Nutritional Information */}
                    {results.nutritionalInfo && (
                      <section className="glass-effect rounded-xl p-3 border border-border/50 shadow-md animate-fade-in" aria-labelledby="nutrition-heading">
                        <h3 id="nutrition-heading" className="text-sm font-bold text-foreground mb-2 tracking-tight">
                          Nutrition (per 100g)
                        </h3>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center py-1 border-b border-border/30">
                            <span className="text-xs text-muted-foreground">Protein</span>
                            <span className="text-sm font-bold text-primary">{results.nutritionalInfo.protein}g</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-border/30">
                            <span className="text-xs text-muted-foreground">Omega-3</span>
                            <span className="text-sm font-bold text-primary">{results.nutritionalInfo.omega3}</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-xs text-muted-foreground">Calories</span>
                            <span className="text-sm font-bold text-primary">{results.nutritionalInfo.calories} kcal</span>
                          </div>
                        </div>
                        <div className="h-28 mt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                              { name: 'Protein (g)', value: results.nutritionalInfo.protein, fill: 'hsl(var(--primary))' },
                              { name: 'Cal/10', value: results.nutritionalInfo.calories / 10, fill: 'hsl(var(--chart-2))' }
                            ]}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                              <YAxis tick={{ fontSize: 9 }} />
                              <Tooltip />
                              <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </section>
                    )}

                    {/* Quality Indicators */}
                    <section aria-labelledby="quality-heading" className="animate-fade-in">
                      <h3 id="quality-heading" className="text-sm font-bold text-foreground mb-2 tracking-tight">
                        Quality Indicators
                      </h3>
                      <QuickStats stats={results.stats!} />
                    </section>

                    {/* AI Reasoning */}
                    <section className="glass-effect rounded-xl p-3 border border-border/50 shadow-md animate-fade-in" aria-labelledby="analysis-heading">
                      <h3 id="analysis-heading" className="text-sm font-bold text-foreground mb-1.5 tracking-tight">
                        AI Analysis
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                        {results.freshness!.reasoning}
                      </p>
                    </section>

                    {/* Recommendations */}
                    <section className="glass-effect rounded-xl p-3 border border-border/50 shadow-md animate-fade-in" aria-labelledby="recommendations-heading">
                      <h3 id="recommendations-heading" className="text-sm font-bold text-foreground mb-2 tracking-tight">
                        Recommendations
                      </h3>
                      <ul className="space-y-1 text-xs text-muted-foreground" role="list">
                        {results.freshness!.level === "fresh" && (
                          <>
                            <li className="flex items-start gap-1.5">
                              <span className="text-success mt-0.5">✓</span>
                              <span>Suitable for raw consumption (sushi/sashimi)</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-success mt-0.5">✓</span>
                              <span>Best consumed within 24-48 hours</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-success mt-0.5">✓</span>
                              <span>Store at 32-39°F (0-4°C)</span>
                            </li>
                          </>
                        )}
                        {results.freshness!.level === "moderate" && (
                          <>
                            <li className="flex items-start gap-1.5">
                              <span className="text-warning mt-0.5">⚠</span>
                              <span>Cook thoroughly before consumption</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-warning mt-0.5">⚠</span>
                              <span>Consume within 12-24 hours</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-warning mt-0.5">⚠</span>
                              <span>Keep refrigerated at all times</span>
                            </li>
                          </>
                        )}
                        {results.freshness!.level === "poor" && (
                          <>
                            <li className="flex items-start gap-1.5">
                              <span className="text-destructive mt-0.5">✗</span>
                              <span>Not recommended for consumption</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-destructive mt-0.5">✗</span>
                              <span>Dispose of safely</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-destructive mt-0.5">✗</span>
                              <span>Check storage conditions</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </section>
                  </div>

                  {/* Habitat - full width below grid */}
                  {results.habitat && results.commonAreas && (
                    <section className="col-span-2 glass-effect rounded-xl p-3 border border-border/50 shadow-md animate-fade-in" aria-labelledby="habitat-heading">
                      <h3 id="habitat-heading" className="text-sm font-bold text-foreground mb-2 tracking-tight">
                        Habitat & Collection Areas
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{results.habitat}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {results.commonAreas.map((area, index) => (
                          <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-medium">
                            {area}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Location - full width */}
                  {location && (
                    <section className="col-span-2 glass-effect rounded-xl p-3 border border-border/50 shadow-md animate-fade-in" aria-labelledby="location-heading">
                      <h3 id="location-heading" className="text-sm font-bold text-foreground mb-2 tracking-tight flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        Scan Location
                      </h3>
                      <div className="h-32 bg-muted rounded-lg overflow-hidden border border-border/30">
                        <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 0 }}
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.01},${location.latitude - 0.01},${location.longitude + 0.01},${location.latitude + 0.01}&layer=mapnik&marker=${location.latitude},${location.longitude}`}
                          allowFullScreen
                          title="Scan location map"
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs py-1.5 mt-1">
                        <span className="text-muted-foreground">Coords:</span>
                        <span className="font-mono text-primary text-[11px]">
                          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </span>
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
};

export default Index;
