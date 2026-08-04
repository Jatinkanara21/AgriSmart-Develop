import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { 
  useGetFarm, 
  useListCrops, 
  useCreateCrop,
  getListCropsQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Sprout, 
  Calendar, 
  MapPin, 
  Ruler, 
  MountainSnow, 
  Plus, 
  ChevronRight,
  ArrowLeft,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CropStatus } from '@workspace/api-client-react';

export default function FarmDetail() {
  const { id } = useParams();
  const farmId = Number(id);
  const { data: farm, isLoading: farmLoading } = useGetFarm(farmId, { query: { enabled: !!farmId } });
  const { data: crops, isLoading: cropsLoading } = useListCrops(farmId, { query: { enabled: !!farmId } });
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createCrop = useCreateCrop();

  const [formData, setFormData] = useState({
    name: '',
    variety: '',
    status: CropStatus.growing as CropStatus,
    plantingDate: format(new Date(), 'yyyy-MM-dd'),
    expectedYield: ''
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createCrop.mutate(
      { 
        farmId,
        data: {
          name: formData.name,
          variety: formData.variety || undefined,
          status: formData.status,
          plantingDate: formData.plantingDate,
          expectedYield: formData.expectedYield ? Number(formData.expectedYield) : undefined,
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCropsQueryKey(farmId) });
          setIsCreateOpen(false);
          setFormData({
            name: '',
            variety: '',
            status: CropStatus.growing,
            plantingDate: format(new Date(), 'yyyy-MM-dd'),
            expectedYield: ''
          });
          toast({ title: 'Crop added successfully' });
        },
        onError: () => {
          toast({ title: 'Failed to add crop', variant: 'destructive' });
        }
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'growing': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400';
      case 'harvested': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400';
      case 'planned': return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (farmLoading || !farm) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground" asChild>
          <Link href="/farms">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Farms
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{farm.name}</h1>
          <p className="text-muted-foreground mt-1">Manage crops and details for this farm.</p>
        </div>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</span>
              <span className="font-medium text-foreground">{farm.location}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Ruler className="h-3 w-3" /> Area</span>
              <span className="font-medium text-foreground">{farm.area} Acres</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1"><MountainSnow className="h-3 w-3" /> Soil</span>
              <span className="font-medium text-foreground capitalize">{farm.soilType}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Sprout className="h-3 w-3" /> Total Crops</span>
              <span className="font-medium text-foreground">{crops?.length || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center pt-4">
        <h2 className="text-2xl font-bold tracking-tight">Crops</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Crop
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Crop to {farm.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Crop Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Wheat, Cotton"
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variety">Variety (Optional)</Label>
                <Input 
                  id="variety" 
                  placeholder="e.g. Bt Cotton"
                  value={formData.variety} 
                  onChange={(e) => setFormData({...formData, variety: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(val) => setFormData({...formData, status: val as CropStatus})}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(CropStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plantingDate">Planting Date</Label>
                  <Input 
                    id="plantingDate" 
                    type="date"
                    value={formData.plantingDate} 
                    onChange={(e) => setFormData({...formData, plantingDate: e.target.value})}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedYield">Expected Yield (kg - Optional)</Label>
                <Input 
                  id="expectedYield" 
                  type="number"
                  min="0"
                  value={formData.expectedYield} 
                  onChange={(e) => setFormData({...formData, expectedYield: e.target.value})}
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createCrop.isPending}>
                  {createCrop.isPending ? 'Saving...' : 'Save Crop'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {cropsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : !crops?.length ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
              <Sprout className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No crops added yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Add your first crop to this farm to start tracking its growth and expenses.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="border-secondary text-secondary hover:bg-secondary/10">
              Add Your First Crop
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {crops.map((crop) => (
            <Card key={crop.id} className="hover-elevate transition-all border-border shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-bold">{crop.name}</CardTitle>
                    {crop.variety && <CardDescription>{crop.variety}</CardDescription>}
                  </div>
                  <Badge variant="outline" className={`${getStatusColor(crop.status)} capitalize px-2 py-0.5 border`}>
                    {crop.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-2 mt-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2 opacity-70" />
                    <span>Planted: {format(new Date(crop.plantingDate), 'MMM d, yyyy')}</span>
                  </div>
                  {crop.expectedYield && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4 mr-2 opacity-70" />
                      <span>Exp. Yield: {crop.expectedYield} kg</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <Button variant="ghost" className="w-full justify-between hover:bg-primary/5 hover:text-primary p-0 h-auto" asChild>
                    <Link href={`/crops/${crop.id}`}>
                      <span className="font-medium text-sm">Manage Crop</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
