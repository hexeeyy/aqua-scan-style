import { useState, useEffect, useCallback } from "react";
import { Camera, Info, Loader2, Volume2, VolumeX, XCircle, MapPin, ShoppingBag, FlaskConical, Fish, Thermometer, DollarSign, Apple, Eye, Shield, Target, Activity, BarChart3, Brain, Clock, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { RealCameraCapture } from "@/components/RealCameraCapture";
import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import { SpeciesCard } from "@/components/SpeciesCard";
import { QuickStats } from "@/components/QuickStats";
import { ModelMetrics } from "@/components/ModelMetrics";
import { ResultPanel } from "@/components/ResultPanel";
import { FreshnessGauge } from "@/components/FreshnessGauge";
import { SpoilageCountdown } from "@/components/SpoilageCountdown";
import { MarketDurationCard, type MarketDuration, type ConsumerRecommendation } from "@/components/MarketDurationCard";
import { ScanQRCode } from "@/components/ScanQRCode";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { saveScanToHistory, type ScanRecord } from "@/components/ScanHistory";
import { saveScanToDb } from "@/lib/scanHistoryDb";
import { useAuth } from "@/contexts/AuthContext";
import { SplashScreen } from "@/components/SplashScreen";
import { SystemOverview, ScanActivityChart, SpectrumAnalysis, FreshnessDistribution, QualityRadar, LiveStats } from "@/components/DashboardPanels";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useGsapDashboard, useGsapResults } from "@/hooks/useGsapAnimations";

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
  spoilagePrediction?: {
    hoursAtRoomTemp: number;
    storage: Array<{ method: string; shelfLife: string; tempRange: string }>;
    riskLevel: string;
    recommendation: string;
  };
  marketDuration?: MarketDuration;
  consumerRecommendation?: ConsumerRecommendation;
}

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
}

const Index = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const gsapRef = useGsapDashboard();
  const resultsRef = useGsapResults(showResults);

  const requestFullscreen = useCallback((el: HTMLElement) => {
    const rfs = el.requestFullscreen
      || (el as any).mozRequestFullScreen
      || (el as any).webkitRequestFullscreen
      || (el as any).msRequestFullscreen;
    return rfs?.call(el) ?? Promise.reject();
  }, []);

  const exitFullscreen = useCallback(() => {
    const efs = document.exitFullscreen
      || (document as any).mozCancelFullScreen
      || (document as any).webkitExitFullscreen
      || (document as any).msExitFullscreen;
    return efs?.call(document) ?? Promise.reject();
  }, []);

  const getFullscreenElement = useCallback(() => {
    return document.fullscreenElement
      || (document as any).mozFullScreenElement
      || (document as any).webkitFullscreenElement
      || (document as any).msFullscreenElement;
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!getFullscreenElement()) {
      requestFullscreen(document.documentElement).then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, [requestFullscreen, exitFullscreen, getFullscreenElement]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!getFullscreenElement());
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('mozfullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('mozfullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, [getFullscreenElement]);

  useEffect(() => {
    if (!showSplash && !getFullscreenElement()) {
      const timer = setTimeout(() => {
        requestFullscreen(document.documentElement)
          .then(() => setIsFullscreen(true))
          .catch(() => {
            const enterFullscreen = () => {
              requestFullscreen(document.documentElement)
                .then(() => setIsFullscreen(true))
                .catch(() => {});
              document.removeEventListener('click', enterFullscreen);
            };
            document.addEventListener('click', enterFullscreen, { once: true });
          });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showSplash, requestFullscreen, getFullscreenElement]);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const handleCameraOpen = () => setShowCamera(true);
  const handleCameraCancel = () => setShowCamera(false);

  const handleCapture = async (imageData: string) => {
    setShowCamera(false);
    setCapturedImage(imageData);
    setIsAnalyzing(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: Date.now()
          });
        },
        (error) => console.log('Location access denied:', error)
      );
    }

    try {
      const { data, error } = await supabase.functions.invoke('analyze-fish', {
        body: { image: imageData }
      });

      if (error) throw error;
      if (!data) throw new Error("No data returned from analysis");

      const analysisData = data as AnalysisResult;
      setResults(analysisData);
      setShowResults(true);
      
      if (analysisData.isActuallyFish === false) {
        toast({ title: "Not a Fish", description: "This is not a fish. Please capture an image of a fish.", variant: "destructive" });
      } else {
        if (analysisData.species && analysisData.freshness) {
          const record: ScanRecord = {
            id: (typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            timestamp: Date.now(),
            thumbnail: imageData,
            species: analysisData.species,
            freshness: analysisData.freshness,
            pricePerKilo: analysisData.pricePerKilo,
            nutritionalInfo: analysisData.nutritionalInfo,
            stats: analysisData.stats,
            spoilagePrediction: analysisData.spoilagePrediction,
          };
          saveScanToHistory(record);
          if (user) {
            saveScanToDb(record, user.id, analysisData.marketDuration, analysisData.consumerRecommendation)
              .then((token) => { if (token) setShareToken(token); });
          }
        }
        toast({ title: "Analysis Complete", description: `Detected ${analysisData.species?.name} with ${analysisData.species?.confidence}% confidence` });
      }
    } catch (error) {
      console.error("Error analyzing fish:", error);
      toast({ title: "Analysis Failed", description: error instanceof Error ? error.message : "Failed to analyze the image.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNewScan = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setShowResults(false);
    setResults(null);
    setCapturedImage(null);
    setShareToken(null);
  };

  const toggleVoiceNarration = () => {
    if (!results || results.isActuallyFish === false) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const text = `Analysis results for ${results.species?.name}. Confidence: ${results.species?.confidence}%. Freshness level: ${results.freshness?.level}. Score: ${results.freshness?.score} out of 100. ${results.freshness?.reasoning}. Current market price: ${results.pricePerKilo?.min ? `${results.pricePerKilo.min} to ${results.pricePerKilo.max} pesos per kilogram` : 'not available'}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
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
          <RealCameraCapture onCapture={handleCapture} onCancel={handleCameraCancel} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      <Navbar isFullscreen={isFullscreen} toggleFullscreen={toggleFullscreen} onScanClick={handleCameraOpen} />

      <main ref={gsapRef} className="max-w-5xl mx-auto px-3 py-1.5 pb-2 flex-1">
        {!showResults ? (
          <>
            {/* Hero + Scan */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="gsap-hero rounded-2xl overflow-hidden shadow-xl hover-lift">
                <div className="relative h-full min-h-[120px]">
                  <img src={heroImage} alt="Fresh fish" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h2 className="text-lg font-bold text-white mb-0.5 tracking-tight">Artificial Intelligence System</h2>
                    <p className="text-white/95 text-xs font-medium">Know the Species. Check the Freshness. All in One.</p>
                  </div>
                </div>
              </div>

              <div className="gsap-scan-area flex flex-col gap-1.5">
                <Button variant="scan" size="lg" className="w-full h-11 text-sm rounded-2xl flex-shrink-0" onClick={handleCameraOpen}>
                  <Camera className="w-5 h-5 mr-2" />
                  Start Camera Scan
                </Button>
                <div className="glass-effect rounded-2xl p-2 space-y-1 shadow-md flex-1 overflow-auto">
                  <h3 className="font-bold text-[11px] text-foreground flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-md bg-primary/20 flex items-center justify-center">
                      <Info className="w-2.5 h-2.5 text-primary" />
                    </div>
                    How to use
                  </h3>
                  <ul className="text-[10px] text-muted-foreground space-y-0.5 ml-1 font-medium">
                    <li className="flex items-start gap-1"><span className="text-primary font-bold">1.</span><span>Tap "Start Camera Scan"</span></li>
                    <li className="flex items-start gap-1"><span className="text-primary font-bold">2.</span><span>Position fish clearly in frame</span></li>
                    <li className="flex items-start gap-1"><span className="text-primary font-bold">3.</span><span>Ensure good lighting</span></li>
                    <li className="flex items-start gap-1"><span className="text-primary font-bold">4.</span><span>Capture & view AI results</span></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Dashboard Panels + Charts - single flowing grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="gsap-panel"><LiveStats /></div>
              <div className="gsap-panel"><SystemOverview /></div>
              <div className="gsap-panel"><FreshnessDistribution /></div>
              <div className="gsap-chart"><ScanActivityChart /></div>
              <div className="gsap-chart"><SpectrumAnalysis /></div>
              <div className="gsap-chart"><QualityRadar /></div>
            </div>
          </>
        ) : results ? (
          <>
            <div role="region" aria-label="Analysis results" ref={resultsRef}>
              <div className="flex items-center justify-between mb-3 gsap-result">
                <div className="flex items-center gap-2">
                  {capturedImage && (
                    <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-primary/30 shadow-md flex-shrink-0">
                      <img src={capturedImage} alt="Scanned fish" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-foreground tracking-tight leading-tight">Scan Results</h2>
                    <p className="text-[10px] text-muted-foreground font-medium">AI-powered analysis complete</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {results.isActuallyFish !== false && (
                    <Button variant="outline" size="icon" className="rounded-xl w-8 h-8" onClick={toggleVoiceNarration}>
                      {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                  )}
                  <Button variant="ocean" size="sm" className="rounded-xl text-xs" onClick={handleNewScan}>New Scan</Button>
                </div>
              </div>

              {results.isActuallyFish === false ? (
                <div className="bg-destructive/10 border-2 border-destructive/50 rounded-2xl p-6 text-center glass-effect animate-scale-in" role="alert">
                  <div className="w-14 h-14 rounded-2xl bg-destructive/20 flex items-center justify-center mx-auto mb-3">
                    <XCircle className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="text-xl font-bold text-destructive mb-2">Not a Fish!</h3>
                  <p className="text-muted-foreground font-medium text-sm">The image does not appear to be a fish. Please try again.</p>
                </div>
              ) : (
                <Tabs defaultValue="consumer" className="w-full">
                  <TabsList className="w-full mb-2 bg-muted/50 backdrop-blur-sm rounded-xl p-1 h-9">
                    <TabsTrigger value="consumer" className="flex-1 rounded-lg text-[11px] font-bold gap-1.5 data-[state=active]:bg-ocean-gradient data-[state=active]:text-primary-foreground">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Vendors & Consumers
                    </TabsTrigger>
                    <TabsTrigger value="researcher" className="flex-1 rounded-lg text-[11px] font-bold gap-1.5 data-[state=active]:bg-ocean-gradient data-[state=active]:text-primary-foreground">
                      <FlaskConical className="w-3.5 h-3.5" />
                      Researchers & Experts
                    </TabsTrigger>
                  </TabsList>

                  {/* ===== VENDORS & CONSUMERS TAB ===== */}
                  <TabsContent value="consumer" className="mt-0">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        {/* Species ID */}
                        <ResultPanel title="Species Identified" icon={Fish} variant="primary" className="gsap-result">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-foreground truncate">{results.species?.name}</h4>
                              <p className="text-[10px] text-muted-foreground italic truncate">{results.species?.scientificName}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="text-xl font-bold text-primary">{results.species?.confidence}%</span>
                              <p className="text-[8px] text-muted-foreground font-semibold">CONFIDENCE</p>
                            </div>
                          </div>
                          <div className="mt-2 w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-ocean-gradient rounded-full h-2 transition-all duration-1000"
                              style={{ width: `${results.species?.confidence}%` }}
                            />
                          </div>
                        </ResultPanel>

                        <FreshnessIndicator {...results.freshness!} />

                        {/* Freshness Score */}
                        {results.freshness && (
                          <ResultPanel
                            title="Freshness Score"
                            icon={Thermometer}
                            variant={results.freshness.level === "fresh" ? "success" : results.freshness.level === "moderate" ? "warning" : "danger"}
                            className="gsap-result"
                          >
                            <div className="flex items-center gap-3">
                              <FreshnessGauge score={results.freshness.score} level={results.freshness.level} size={88} />
                              <div className="flex-1 space-y-1.5">
                                <p className="text-xs font-bold text-foreground capitalize">{results.freshness.level} Quality</p>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">{results.freshness.reasoning}</p>
                              </div>
                            </div>
                          </ResultPanel>
                        )}

                        {/* Spoilage Prediction */}
                        {results.spoilagePrediction && (
                          <ResultPanel
                            title="Spoilage Prediction"
                            icon={Clock}
                            variant={results.spoilagePrediction.riskLevel === "low" ? "success" : results.spoilagePrediction.riskLevel === "moderate" ? "warning" : "danger"}
                            className="gsap-result"
                          >
                            <div className="space-y-2">
                              <SpoilageCountdown
                                hoursAtRoomTemp={results.spoilagePrediction.hoursAtRoomTemp}
                                riskLevel={results.spoilagePrediction.riskLevel}
                              />
                              <div className="space-y-1">
                                {results.spoilagePrediction.storage.map((s, i) => (
                                  <div key={i} className="flex items-center justify-between py-1 border-b border-border/15 last:border-0">
                                    <div className="flex items-center gap-1.5">
                                      <Snowflake className="w-2.5 h-2.5 text-primary/70" />
                                      <span className="text-[10px] text-muted-foreground">{s.method}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[11px] font-bold text-foreground">{s.shelfLife}</span>
                                      <span className="text-[8px] text-muted-foreground ml-1">({s.tempRange})</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <p className="text-[9px] text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5 leading-relaxed">{results.spoilagePrediction.recommendation}</p>
                            </div>
                          </ResultPanel>
                        )}

                         {/* Quality Indicators */}
                        <ResultPanel title="Quality Indicators" icon={Eye}  variant={results.spoilagePrediction.riskLevel === "low" ? "success" : results.spoilagePrediction.riskLevel === "moderate" ? "warning" : "danger"} className="gsap-result">
                          <QuickStats stats={results.stats!} />
                        </ResultPanel>
                      </div>

                      <div className="space-y-2">
                        {/* Market Price */}
                        {results.pricePerKilo && (
                          <ResultPanel title="Market Price (PH)" icon={DollarSign} variant="primary" className="gsap-result">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-foreground">₱{results.pricePerKilo.min.toLocaleString()} - ₱{results.pricePerKilo.max.toLocaleString()}</span>
                              <span className="text-muted-foreground font-semibold text-[10px]">per kg</span>
                            </div>
                            {results.pricePerKilo.source && (
                              <p className="text-[9px] text-muted-foreground mt-1.5">Source: {results.pricePerKilo.source}</p>
                            )}
                          </ResultPanel>
                        )}

                        {/* Nutrition */}
                        {results.nutritionalInfo && (
                          <ResultPanel title="Nutrition (per 100g)" icon={Apple} variant="success" className="gsap-result">
                            <div className="space-y-1.5">
                              {[
                                { label: "Protein", value: `${results.nutritionalInfo.protein}g`, icon: "💪" },
                                { label: "Omega-3", value: results.nutritionalInfo.omega3, icon: "🐟" },
                                { label: "Calories", value: `${results.nutritionalInfo.calories} kcal`, icon: "🔥" },
                              ].map((n, i) => (
                                <div key={n.label} className={`flex justify-between items-center py-1.5 ${i < 2 ? 'border-b border-border/20' : ''}`}>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <span>{n.icon}</span>{n.label}
                                  </span>
                                  <span className="text-sm font-bold text-foreground">{n.value}</span>
                                </div>
                              ))}
                            </div>
                            <div className="h-24 mt-2">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                  { name: 'Protein (g)', value: results.nutritionalInfo.protein, fill: 'hsl(var(--primary))' },
                                  { name: 'Cal/10', value: results.nutritionalInfo.calories / 10, fill: 'hsl(var(--success))' }
                                ]}>
                                  <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                                  <YAxis tick={{ fontSize: 9 }} />
                                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                                  <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </ResultPanel>
                        )}

                        {/* Market Duration & Consumer Advice */}
                        {results.marketDuration && results.consumerRecommendation && (
                          <MarketDurationCard
                            marketDuration={results.marketDuration}
                            consumerRecommendation={results.consumerRecommendation}
                            onViewDetails={() => navigate("/recommendations", {
                              state: {
                                marketDuration: results.marketDuration,
                                consumerRecommendation: results.consumerRecommendation,
                                species: results.species?.name,
                                freshnessLevel: results.freshness?.level,
                                freshnessScore: results.freshness?.score,
                                capturedImage,
                              },
                            })}
                          />
                        )}

                        {/* Recommendations */}
                        <ResultPanel title="General Tips" icon={Shield} variant={results.freshness!.level === "fresh" ? "success" : results.freshness!.level === "moderate" ? "warning" : "danger"} className="gsap-result">
                          <ul className="space-y-1.5 text-xs text-muted-foreground">
                            {results.freshness!.level === "fresh" && (
                              <>
                                <li className="flex items-start gap-1.5"><span className="text-success mt-0.5">✓</span><span>Suitable for raw consumption (sushi/sashimi)</span></li>
                                <li className="flex items-start gap-1.5"><span className="text-success mt-0.5">✓</span><span>Best consumed within 24-48 hours</span></li>
                                <li className="flex items-start gap-1.5"><span className="text-success mt-0.5">✓</span><span>Store at 32-39°F (0-4°C)</span></li>
                              </>
                            )}
                            {results.freshness!.level === "moderate" && (
                              <>
                                <li className="flex items-start gap-1.5"><span className="text-warning mt-0.5">⚠</span><span>Cook thoroughly before consumption</span></li>
                                <li className="flex items-start gap-1.5"><span className="text-warning mt-0.5">⚠</span><span>Consume within 12-24 hours</span></li>
                                <li className="flex items-start gap-1.5"><span className="text-warning mt-0.5">⚠</span><span>Keep refrigerated at all times</span></li>
                              </>
                            )}
                            {results.freshness!.level === "poor" && (
                              <>
                                <li className="flex items-start gap-1.5"><span className="text-destructive mt-0.5">✗</span><span>Not recommended for consumption</span></li>
                                <li className="flex items-start gap-1.5"><span className="text-destructive mt-0.5">✗</span><span>Dispose of safely</span></li>
                                <li className="flex items-start gap-1.5"><span className="text-destructive mt-0.5">✗</span><span>Check storage conditions</span></li>
                              </>
                            )}
                          </ul>
                        </ResultPanel>
                      </div>

                      {/* Habitat - full width */}
                      {results.habitat && results.commonAreas && (
                        <ResultPanel title="Habitat & Collection Areas" icon={MapPin} variant="primary" className="col-span-2 gsap-result">
                          <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{results.habitat}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {results.commonAreas.map((area, i) => (
                              <span key={i} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-semibold border border-primary/20">{area}</span>
                            ))}
                          </div>
                        </ResultPanel>
                      )}

                      {/* Location */}
                      {location && (
                        <ResultPanel title="Scan Location" icon={MapPin} variant="primary" className="col-span-2 gsap-result">
                          <div className="h-32 bg-muted rounded-lg overflow-hidden border border-border/30">
                            <iframe
                              width="100%" height="100%" frameBorder="0" style={{ border: 0 }}
                              src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.01},${location.latitude - 0.01},${location.longitude + 0.01},${location.latitude + 0.01}&layer=mapnik&marker=${location.latitude},${location.longitude}`}
                              allowFullScreen title="Scan location map"
                            />
                          </div>
                          <div className="flex justify-between items-center text-xs py-1.5 mt-1">
                            <span className="text-muted-foreground">Coords:</span>
                            <span className="font-mono text-primary text-[11px]">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
                          </div>
                        </ResultPanel>
                      )}

                      {/* QR Code for sharing */}
                      {shareToken && (
                        <ScanQRCode shareToken={shareToken} />
                      )}
                    </div>
                  </TabsContent>

                  {/* ===== RESEARCHERS & EXPERTS TAB ===== */}
                  <TabsContent value="researcher" className="mt-0">
                    <div className="grid grid-cols-2 gap-1.5 auto-rows-min">
                      <div className="gsap-result">
                        <SpeciesCard {...results.species!} />
                      </div>

                      {results.freshness && (
                        <ResultPanel title="Freshness Analysis" icon={Thermometer} variant={results.freshness.level === "fresh" ? "success" : results.freshness.level === "moderate" ? "warning" : "danger"} className="gsap-result">
                          <div className="flex items-center gap-2">
                            <FreshnessGauge score={results.freshness.score} level={results.freshness.level} size={64} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-foreground capitalize mb-0.5">{results.freshness.level} Quality</p>
                              <p className="text-[9px] text-muted-foreground leading-snug line-clamp-3">{results.freshness.reasoning}</p>
                            </div>
                          </div>
                        </ResultPanel>
                      )}

                      <div className="col-span-2 gsap-result">
                        <ModelMetrics
                          confidence={results.species?.confidence ?? 0}
                          freshnessScore={results.freshness?.score ?? 0}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </>
        ) : null}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
