import { useState } from 'react';
import { 
  useListDiseaseDetections, 
  useCreateDiseaseDetection,
  useListFarms,
  useListCrops,
  getListDiseaseDetectionsQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Upload, 
  Leaf, 
  ShieldCheck, 
  ShieldAlert, 
  Image as ImageIcon,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export default function DiseaseDetection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: farms } = useListFarms();
  const { data: history, isLoading: historyLoading } = useListDiseaseDetections();
  const createDetection = useCreateDiseaseDetection();

  const [selectedFarm, setSelectedFarm] = useState<string>('');
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Load crops for selected farm
  const { data: crops } = useListCrops(
    Number(selectedFarm), 
    { query: { enabled: !!selectedFarm, queryKey: ['crops', selectedFarm] } }
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Image too large. Maximum size is 5MB.', variant: 'destructive' });
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = () => {
    if (!selectedFarm) {
      toast({ title: 'Please select a farm', variant: 'destructive' });
      return;
    }
    if (!imageBase64) {
      toast({ title: 'Please upload an image', variant: 'destructive' });
      return;
    }

    setAnalyzing(true);
    
    // Simulate AI processing delay for better UX
    setTimeout(() => {
      createDetection.mutate(
        {
          data: {
            farmId: Number(selectedFarm),
            cropId: selectedCrop ? Number(selectedCrop) : undefined,
            imageBase64: imageBase64
          }
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListDiseaseDetectionsQueryKey() });
            toast({ title: 'Analysis complete!' });
            setImagePreview(null);
            setImageBase64(null);
            setAnalyzing(false);
          },
          onError: () => {
            toast({ title: 'Analysis failed', variant: 'destructive' });
            setAnalyzing(false);
          }
        }
      );
    }, 1500);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.5) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Leaf className="h-8 w-8 text-primary" />
          Disease Detection
        </h1>
        <p className="text-muted-foreground mt-1">Upload leaf images for AI-powered disease identification.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>New Scan</CardTitle>
            <CardDescription>Select location and upload a clear photo of the affected leaf.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Farm *</Label>
              <Select value={selectedFarm} onValueChange={setSelectedFarm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select farm" />
                </SelectTrigger>
                <SelectContent>
                  {farms?.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id.toString()}>{farm.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedFarm && crops && crops.length > 0 && (
              <div className="space-y-2 animate-in fade-in">
                <Label>Crop (Optional)</Label>
                <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select crop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unknown / Not Listed</SelectItem>
                    {crops.map((crop) => (
                      <SelectItem key={crop.id} value={crop.id.toString()}>{crop.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <Label>Leaf Image *</Label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-border px-6 py-8 hover:bg-muted/50 transition-colors">
                <div className="text-center">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="mx-auto h-40 object-cover rounded-md shadow-sm" />
                      <button 
                        onClick={() => { setImagePreview(null); setImageBase64(null); }}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
                      <div className="mt-4 flex text-sm leading-6 text-muted-foreground justify-center">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
                        >
                          <span>Upload a file</span>
                          <input id="file-upload" name="file-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                        </label>
                      </div>
                      <p className="text-xs leading-5 text-muted-foreground mt-2">PNG, JPG up to 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button 
              className="w-full mt-4" 
              size="lg"
              disabled={!selectedFarm || !imageBase64 || analyzing}
              onClick={handleAnalyze}
            >
              {analyzing ? (
                <><Activity className="h-5 w-5 mr-2 animate-pulse" /> Analyzing Image...</>
              ) : (
                <><Upload className="h-5 w-5 mr-2" /> Analyze Scan</>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold">Scan History</h3>
          
          {historyLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
          ) : !history?.length ? (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-bold text-foreground">No scans yet</h3>
                <p className="text-muted-foreground">Upload your first leaf image to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {history.map((detection) => (
                <Card key={detection.id} className={`overflow-hidden transition-all ${detection.isHealthy ? 'border-green-200' : 'border-red-200'}`}>
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-48 h-48 bg-black/5 shrink-0 border-r">
                      <img src={detection.imageUrl} alt="Scanned leaf" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {detection.isHealthy ? (
                            <ShieldCheck className="h-5 w-5 text-green-600" />
                          ) : (
                            <ShieldAlert className="h-5 w-5 text-red-600" />
                          )}
                          <h4 className="text-xl font-bold text-foreground">{detection.diseaseName}</h4>
                        </div>
                        <Badge variant="outline" className="text-muted-foreground">
                          {format(new Date(detection.createdAt), 'MMM d, yyyy')}
                        </Badge>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground font-medium">AI Confidence</span>
                          <span className="font-bold">{Math.round(detection.confidence * 100)}%</span>
                        </div>
                        <Progress 
                          value={detection.confidence * 100} 
                          className="h-1.5"
                          indicatorClassName={getConfidenceColor(detection.confidence)}
                        />
                      </div>

                      {!detection.isHealthy && (
                        <div className="space-y-3 mt-4 text-sm">
                          <div>
                            <span className="font-semibold text-foreground">Symptoms: </span>
                            <span className="text-muted-foreground">{detection.symptoms}</span>
                          </div>
                          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-100 dark:border-amber-900/50">
                            <span className="font-semibold text-amber-900 dark:text-amber-400 block mb-1">Recommended Treatment:</span>
                            <span className="text-amber-800 dark:text-amber-300/80">{detection.treatment}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
