import { useState } from 'react';
import { 
  useListExpenses, 
  useGetExpenseSummary, 
  useCreateExpense,
  useListFarms,
  getListExpensesQueryKey,
  getGetExpenseSummaryQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  IndianRupee, 
  Plus, 
  Filter, 
  PieChart as PieChartIcon, 
  BarChart3,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ExpenseCategory } from '@workspace/api-client-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const CHART_COLORS = ['#1a6635', '#d98b0b', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'];

export default function Expenses() {
  const [selectedFarm, setSelectedFarm] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: farms } = useListFarms();
  const farmIdParam = selectedFarm !== 'all' ? Number(selectedFarm) : undefined;
  
  const { data: expenses, isLoading: expensesLoading } = useListExpenses(
    farmIdParam ? { farmId: farmIdParam } : undefined,
    { query: { queryKey: getListExpensesQueryKey(farmIdParam ? { farmId: farmIdParam } : undefined) } }
  );
  
  const { data: summary, isLoading: summaryLoading } = useGetExpenseSummary(
    farmIdParam ? { farmId: farmIdParam } : undefined,
    { query: { queryKey: getGetExpenseSummaryQueryKey(farmIdParam ? { farmId: farmIdParam } : undefined) } }
  );

  const createExpense = useCreateExpense();

  const [formData, setFormData] = useState({
    farmId: '',
    category: ExpenseCategory.seeds as ExpenseCategory,
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.farmId) {
      toast({ title: 'Please select a farm', variant: 'destructive' });
      return;
    }

    createExpense.mutate(
      { 
        data: {
          farmId: Number(formData.farmId),
          category: formData.category,
          amount: Number(formData.amount),
          description: formData.description || undefined,
          date: formData.date
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetExpenseSummaryQueryKey() });
          setIsCreateOpen(false);
          setFormData({
            farmId: '',
            category: ExpenseCategory.seeds,
            amount: '',
            description: '',
            date: format(new Date(), 'yyyy-MM-dd')
          });
          toast({ title: 'Expense added successfully' });
        },
        onError: () => {
          toast({ title: 'Failed to add expense', variant: 'destructive' });
        }
      }
    );
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'seeds': return 'bg-emerald-100 text-emerald-800';
      case 'fertilizers': return 'bg-amber-100 text-amber-800';
      case 'pesticides': return 'bg-red-100 text-red-800';
      case 'labor': return 'bg-blue-100 text-blue-800';
      case 'irrigation': return 'bg-cyan-100 text-cyan-800';
      case 'equipment': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Expenses</h1>
          <p className="text-muted-foreground mt-1">Track and analyze your farming costs.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedFarm} onValueChange={setSelectedFarm}>
            <SelectTrigger className="w-[180px] bg-background">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Farms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Farms</SelectItem>
              {farms?.map((farm) => (
                <SelectItem key={farm.id} value={farm.id.toString()}>{farm.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="farmId">Farm</Label>
                  <Select 
                    value={formData.farmId} 
                    onValueChange={(val) => setFormData({...formData, farmId: val})}
                  >
                    <SelectTrigger id="farmId">
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
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(val) => setFormData({...formData, category: val as ExpenseCategory})}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ExpenseCategory).map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input 
                      id="amount" 
                      type="number"
                      min="1"
                      value={formData.amount} 
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    type="date"
                    value={formData.date} 
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input 
                    id="description" 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="e.g. Urea 50kg bags"
                  />
                </div>
                
                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createExpense.isPending}>
                    {createExpense.isPending ? 'Saving...' : 'Save Expense'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-primary-foreground/80 font-medium text-sm">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-10 w-32 bg-primary-foreground/20" />
            ) : (
              <div className="text-4xl font-bold">
                ₹{summary?.totalYear?.toLocaleString('en-IN') || 0}
              </div>
            )}
            <p className="text-primary-foreground/70 text-sm mt-2 flex items-center">
              <Calendar className="h-4 w-4 mr-1" /> This Year
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="category" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="category"><PieChartIcon className="h-4 w-4 mr-2" /> By Category</TabsTrigger>
                <TabsTrigger value="trend"><BarChart3 className="h-4 w-4 mr-2" /> Monthly Trend</TabsTrigger>
              </TabsList>
              <TabsContent value="category" className="h-[250px]">
                {summaryLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : summary?.byCategory && summary.byCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.byCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="total"
                        nameKey="category"
                      >
                        {summary.byCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => `₹${val.toLocaleString('en-IN')}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
                )}
              </TabsContent>
              <TabsContent value="trend" className="h-[250px]">
                {summaryLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : summary?.byMonth && summary.byMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.byMonth}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip formatter={(val: number) => `₹${val.toLocaleString('en-IN')}`} cursor={{ fill: 'var(--muted)' }} />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {expensesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !expenses?.length ? (
            <div className="py-8 text-center text-muted-foreground">
              <IndianRupee className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
              No expenses recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => {
                const farmName = farms?.find(f => f.id === expense.farmId)?.name || `Farm #${expense.farmId}`;
                return (
                  <div key={expense.id} className="flex items-center p-4 rounded-lg border bg-card hover-elevate transition-all">
                    <div className="hidden sm:flex w-12 h-12 rounded-full bg-muted items-center justify-center mr-4">
                      <IndianRupee className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className={`${getCategoryColor(expense.category)} border-none`}>
                          {expense.category}
                        </Badge>
                        <span className="text-sm font-medium text-muted-foreground">{farmName}</span>
                      </div>
                      <p className="font-medium text-foreground">{expense.description || `${expense.category} expense`}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(expense.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-foreground">₹{expense.amount.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
