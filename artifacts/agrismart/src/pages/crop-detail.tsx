import { useState } from 'react';
import { useParams, Link } from 'wouter';
import {
  useGetCrop,
  useUpdateCrop,
  useDeleteCrop,
  useListExpenses,
  getListExpensesQueryKey,
} from '@workspace/api-client-react';
import { CropStatus } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Sprout,
  Calendar,
  ArrowLeft,
  Edit2,
  Trash2,
  IndianRupee,
  Leaf,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  growing: { label: 'Growing', icon: Sprout, className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400' },
  harvested: { label: 'Harvested', icon: CheckCircle2, className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400' },
  failed: { label: 'Failed', icon: XCircle, className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400' },
  planned: { label: 'Planned', icon: Clock, className: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300' },
};

export default function CropDetail() {
  const { id } = useParams();
  const cropId = Number(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: crop, isLoading } = useGetCrop(cropId, { query: { enabled: !!cropId } });
  const { data: expenses } = useListExpenses(
    { cropId },
    { query: { enabled: !!cropId, queryKey: getListExpensesQueryKey({ cropId }) } }
  );

  const updateCrop = useUpdateCrop();
  const deleteCrop = useDeleteCrop();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    variety: '',
    status: CropStatus.growing as CropStatus,
    plantingDate: '',
    harvestDate: '',
    expectedYield: '',
    actualYield: '',
    notes: '',
  });

  const openEdit = () => {
    if (!crop) return;
    setEditData({
      name: crop.name,
      variety: crop.variety ?? '',
      status: crop.status as CropStatus,
      plantingDate: crop.plantingDate ? crop.plantingDate.slice(0, 10) : '',
      harvestDate: crop.harvestDate ? crop.harvestDate.slice(0, 10) : '',
      expectedYield: crop.expectedYield != null ? String(crop.expectedYield) : '',
      actualYield: crop.actualYield != null ? String(crop.actualYield) : '',
      notes: crop.notes ?? '',
    });
    setIsEditOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateCrop.mutate(
      {
        id: cropId,
        data: {
          name: editData.name,
          variety: editData.variety || undefined,
          status: editData.status,
          plantingDate: editData.plantingDate || undefined,
          harvestDate: editData.harvestDate || undefined,
          expectedYield: editData.expectedYield ? Number(editData.expectedYield) : undefined,
          actualYield: editData.actualYield ? Number(editData.actualYield) : undefined,
          notes: editData.notes || undefined,
        },
      },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          toast({ title: 'Crop updated successfully' });
        },
        onError: () => {
          toast({ title: 'Failed to update crop', variant: 'destructive' });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!confirm('Delete this crop? This action cannot be undone.')) return;
    deleteCrop.mutate(
      { id: cropId },
      {
        onSuccess: () => {
          toast({ title: 'Crop deleted' });
          if (crop?.farmId) navigate(`/farms/${crop.farmId}`);
          else navigate('/farms');
        },
        onError: () => {
          toast({ title: 'Failed to delete crop', variant: 'destructive' });
        },
      }
    );
  };

  if (isLoading || !crop) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  const status = statusConfig[crop.status] ?? statusConfig.growing;
  const StatusIcon = status.icon;
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={crop.farmId ? `/farms/${crop.farmId}` : '/farms'}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Leaf className="h-7 w-7 text-primary" />
              {crop.name}
              {crop.variety && (
                <span className="text-xl font-normal text-muted-foreground">({crop.variety})</span>
              )}
            </h1>
            <Badge className={`mt-1 inline-flex items-center gap-1 border ${status.className}`}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={openEdit}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Crop</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdate} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Crop Name *</Label>
                    <Input
                      required
                      value={editData.name}
                      onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Variety</Label>
                    <Input
                      value={editData.variety}
                      onChange={(e) => setEditData((d) => ({ ...d, variety: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={editData.status}
                    onValueChange={(v) => setEditData((d) => ({ ...d, status: v as CropStatus }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.values(CropStatus).map((s) => (
                        <SelectItem key={s} value={s}>{statusConfig[s]?.label ?? s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Planting Date</Label>
                    <Input
                      type="date"
                      value={editData.plantingDate}
                      onChange={(e) => setEditData((d) => ({ ...d, plantingDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Expected Harvest</Label>
                    <Input
                      type="date"
                      value={editData.harvestDate}
                      onChange={(e) => setEditData((d) => ({ ...d, harvestDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Expected Yield (kg)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editData.expectedYield}
                      onChange={(e) => setEditData((d) => ({ ...d, expectedYield: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Actual Yield (kg)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editData.actualYield}
                      onChange={(e) => setEditData((d) => ({ ...d, actualYield: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea
                    rows={3}
                    value={editData.notes}
                    onChange={(e) => setEditData((d) => ({ ...d, notes: e.target.value }))}
                    placeholder="Any additional notes…"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateCrop.isPending}>
                    {updateCrop.isPending ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Planted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {crop.plantingDate ? format(new Date(crop.plantingDate), 'MMM d, yyyy') : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Expected Harvest
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {crop.harvestDate ? format(new Date(crop.harvestDate), 'MMM d, yyyy') : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Sprout className="h-4 w-4" /> Expected Yield
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {crop.expectedYield != null ? `${Number(crop.expectedYield).toLocaleString('en-IN')} kg` : '—'}
            </p>
            {crop.actualYield != null && (
              <p className="text-xs text-muted-foreground mt-1">
                Actual: {Number(crop.actualYield).toLocaleString('en-IN')} kg
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <IndianRupee className="h-4 w-4" /> Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">₹{totalExpenses.toLocaleString('en-IN')}</p>
            <p className="text-xs text-muted-foreground mt-1">{expenses?.length ?? 0} records</p>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {crop.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{crop.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Related Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses && expenses.length > 0 ? (
            <div className="divide-y">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-sm">{expense.description || expense.category}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {expense.category} · {expense.date ? format(new Date(expense.date), 'MMM d, yyyy') : '—'}
                    </p>
                  </div>
                  <span className="font-semibold text-destructive">
                    ₹{Number(expense.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              <IndianRupee className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No expenses recorded for this crop.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
