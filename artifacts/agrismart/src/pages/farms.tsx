import { useState } from 'react';
import { Link } from 'wouter';
import { 
  useListFarms, 
  useCreateFarm, 
  useDeleteFarm, 
  getListFarmsQueryKey 
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Tractor, MapPin, Ruler, MountainSnow, Plus, Trash2, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FarmSoilType } from '@workspace/api-client-react';
import { Empty } from '@/components/ui/empty';

export default function Farms() {
  const { data: farms, isLoading } = useListFarms();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createFarm = useCreateFarm();
  const deleteFarm = useDeleteFarm();

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    area: '',
    soilType: FarmSoilType.loamy as FarmSoilType,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createFarm.mutate(
      { 
        data: {
          name: formData.name,
          location: formData.location,
          area: Number(formData.area),
          soilType: formData.soilType
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFarmsQueryKey() });
          setIsCreateOpen(false);
          setFormData({ name: '', location: '', area: '', soilType: FarmSoilType.loamy });
          toast({ title: 'Farm created successfully' });
        },
        onError: () => {
          toast({ title: 'Failed to create farm', variant: 'destructive' });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this farm?')) {
      deleteFarm.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListFarmsQueryKey() });
            toast({ title: 'Farm deleted successfully' });
          },
          onError: () => {
            toast({ title: 'Failed to delete farm', variant: 'destructive' });
          }
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Farms</h1>
          <p className="text-muted-foreground mt-1">Manage your properties and land.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Farm
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Farm</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Farm Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location (Village/District)</Label>
                <Input 
                  id="location" 
                  value={formData.location} 
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Area (Acres)</Label>
                <Input 
                  id="area" 
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.area} 
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="soilType">Soil Type</Label>
                <Select 
                  value={formData.soilType} 
                  onValueChange={(val) => setFormData({...formData, soilType: val as FarmSoilType})}
                >
                  <SelectTrigger id="soilType">
                    <SelectValue placeholder="Select soil type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(FarmSoilType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createFarm.isPending}>
                  {createFarm.isPending ? 'Saving...' : 'Save Farm'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!farms?.length ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Tractor className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No farms added yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Add your first farm to start tracking crops, expenses, and getting recommendations.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>Add Your First Farm</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {farms.map((farm) => (
            <Card key={farm.id} className="group overflow-hidden hover-elevate transition-all border-border/50 shadow-sm flex flex-col">
              <CardHeader className="pb-3 bg-muted/20 border-b border-border/50">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold text-foreground truncate">{farm.name}</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-1"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(farm.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 pb-2 flex-1">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2 text-primary/70 shrink-0" />
                    <span className="truncate">{farm.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Ruler className="h-4 w-4 mr-2 text-primary/70 shrink-0" />
                    <span>{farm.area} Acres</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MountainSnow className="h-4 w-4 mr-2 text-primary/70 shrink-0" />
                    <span className="capitalize">{farm.soilType} Soil</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 pb-4">
                <Button variant="secondary" className="w-full justify-between bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20" asChild>
                  <Link href={`/farms/${farm.id}`}>
                    View Details
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
