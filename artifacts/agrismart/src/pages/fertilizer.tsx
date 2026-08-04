import { useState } from 'react';
import { 
  useListFertilizerRecommendations, 
  useCreateFertilizerRecommendation,
  useListFarms,
  getListFertilizerRecommendationsQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Beaker, FlaskConical, TestTube2, ThermometerSun, LeafyGreen, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FertilizerRecommendationInputSoilType } from '@workspace/api-client-react';

export default function Fertilizer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: farms } = useListFarms();
  const { data: history, isLoading: historyLoading } = useListFertilizerRecommendations();
  const createRecommendation = useCreateFertilizerRecommendation();

  const [formData, setFormData] = useState({
    farmId: '',
    soilType: FertilizerRecommendationInputSoilType.loamy as FertilizerRecommendationInputSoilType,
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    ph: '',
    cropName: ''
  });

  const handleFarmChange = (farmId: string) => {
    const selectedFarm = farms?.find(f => f.id.toString() === farmId);
    setFormData({
      ...formData,
      farmId,
      // Auto-fill soil type from farm if available
      soilType: selectedFarm ? (selectedFarm.soilType as unknown as FertilizerRecommendationInputSoilType) : formData.soilType
    });
  };

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.farmId) {
      toast({ title: 'Please select a farm', variant: 'destructive' });
      return;
    }

    createRecommendation.mutate(
      {
        data: {
          farmId: Number(formData.farmId),
          soilType: formData.soilType,
          nitrogen: Number(formData.nitrogen),
          phosphorus: Number(formData.phosphorus),
          potassium: Number(formData.potassium),
          ph: Number(formData.ph),
          cropName: formData.cropName || undefined
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFertilizerRecommendationsQueryKey() });
          toast({ title: 'Recommendation generated successfully!' });
          // Reset just the test values
          setFormData({
            ...formData,
            nitrogen: '',
            phosphorus: '',
            potassium: '',
            ph: '',
            cropName: ''
          });
        },
        onError: () => {
          toast({ title: 'Failed to generate recommendation', variant: 'destructive' });
        }
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Beaker className="h-8 w-8 text-primary" />
          Fertilizer Assistant
        </h1>
        <p className="text-muted-foreground mt-1">Get AI-powered nutrient recommendations based on your soil test results.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5 h-fit border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle>Soil Test Input</CardTitle>
            <CardDescription>Enter values from your latest soil health card.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div className="space-y-2">
                <Label>Farm *</Label>
                <Select value={formData.farmId} onValueChange={handleFarmChange}>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Soil Type *</Label>
                  <Select 
                    value={formData.soilType} 
                    onValueChange={(val) => setFormData({...formData, soilType: val as FertilizerRecommendationInputSoilType})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select soil type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(FertilizerRecommendationInputSoilType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Crop (Optional)</Label>
                  <Input 
                    placeholder="e.g. Wheat"
                    value={formData.cropName}
                    onChange={(e) => setFormData({...formData, cropName: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-2 border-t mt-4">
                <h4 className="text-sm font-medium mb-4 text-muted-foreground flex items-center"><TestTube2 className="w-4 h-4 mr-1" /> NPK Values (kg/ha)</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-md border border-blue-100 dark:border-blue-900/30">
                    <Label className="text-blue-700 dark:text-blue-400">Nitrogen (N)</Label>
                    <Input 
                      type="number" required min="0" max="140"
                      value={formData.nitrogen}
                      onChange={(e) => setFormData({...formData, nitrogen: e.target.value})}
                      className="bg-white dark:bg-background border-blue-200"
                    />
                  </div>
                  <div className="space-y-2 bg-red-50/50 dark:bg-red-900/10 p-3 rounded-md border border-red-100 dark:border-red-900/30">
                    <Label className="text-red-700 dark:text-red-400">Phosphorus (P)</Label>
                    <Input 
                      type="number" required min="0" max="145"
                      value={formData.phosphorus}
                      onChange={(e) => setFormData({...formData, phosphorus: e.target.value})}
                      className="bg-white dark:bg-background border-red-200"
                    />
                  </div>
                  <div className="space-y-2 bg-amber-50/50 dark:bg-amber-900/10 p-3 rounded-md border border-amber-100 dark:border-amber-900/30">
                    <Label className="text-amber-700 dark:text-amber-400">Potassium (K)</Label>
                    <Input 
                      type="number" required min="0" max="205"
                      value={formData.potassium}
                      onChange={(e) => setFormData({...formData, potassium: e.target.value})}
                      className="bg-white dark:bg-background border-amber-200"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="flex items-center"><ThermometerSun className="w-4 h-4 mr-1 text-muted-foreground" /> pH Level</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    type="number" step="0.1" required min="0" max="14"
                    value={formData.ph}
                    onChange={(e) => setFormData({...formData, ph: e.target.value})}
                    className="w-24"
                  />
                  <div className="flex-1 h-2 bg-gradient-to-r from-red-500 via-green-500 to-purple-600 rounded-full opacity-60"></div>
                </div>
              </div>

              <Button 
                type="submit"
                className="w-full mt-6" 
                size="lg"
                disabled={createRecommendation.isPending}
              >
                {createRecommendation.isPending ? 'Calculating...' : <><Calculator className="h-5 w-5 mr-2" /> Get Recommendation</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-lg font-bold">Recommendations History</h3>
          
          {historyLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-64 w-full" />)}
            </div>
          ) : !history?.length ? (
            <Card className="border-dashed bg-muted/30 h-64">
              <CardContent className="flex flex-col items-center justify-center h-full text-center">
                <FlaskConical className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-bold text-foreground">No recommendations yet</h3>
                <p className="text-muted-foreground">Enter your soil data to get your first custom plan.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {history.map((rec) => {
                const farmName = farms?.find(f => f.id === rec.farmId)?.name || `Farm #${rec.farmId}`;
                return (
                  <Card key={rec.id} className="overflow-hidden hover-elevate transition-all">
                    <div className="bg-primary/5 p-4 border-b flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <LeafyGreen className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-bold text-foreground">{farmName}</h4>
                          <span className="text-xs text-muted-foreground">
                            {rec.cropName ? `For ${rec.cropName} • ` : ''}{format(new Date(rec.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-xs bg-white dark:bg-background border rounded-md px-2 py-1 font-mono">
                        N:{rec.nitrogen} P:{rec.phosphorus} K:{rec.potassium} pH:{rec.ph}
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Recommended Fertilizer</h5>
                        <p className="text-xl font-bold text-primary">{rec.fertilizerName}</p>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-muted/30 p-3 rounded-md border">
                          <span className="text-xs text-muted-foreground font-semibold block mb-1">DOSAGE</span>
                          <span className="text-sm">{rec.dosage}</span>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-md border">
                          <span className="text-xs text-muted-foreground font-semibold block mb-1">SCHEDULE</span>
                          <span className="text-sm">{rec.schedule}</span>
                        </div>
                      </div>

                      {rec.notes && (
                        <div className="mt-4 text-sm text-muted-foreground bg-amber-50 dark:bg-amber-900/10 p-3 rounded-md border border-amber-100 dark:border-amber-900/30">
                          <strong>Note:</strong> {rec.notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
