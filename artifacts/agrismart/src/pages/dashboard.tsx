import { useGetDashboard } from '@workspace/api-client-react';
import { 
  Tractor, 
  Sprout, 
  IndianRupee, 
  TrendingUp, 
  AlertTriangle,
  Leaf,
  Calendar,
  CloudSun
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';

export default function Dashboard() {
  const { data: dashboard, isLoading } = useGetDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const CHART_COLORS = ['#1a6635', '#d98b0b', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening on your farms today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Farms</CardTitle>
            <Tractor className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{dashboard.totalFarms}</div>
          </CardContent>
        </Card>
        
        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Crops</CardTitle>
            <Sprout className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{dashboard.activeCrops}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of {dashboard.totalCrops} total planned</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <IndianRupee className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹{dashboard.totalExpenses.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-1">Year to date</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Est. Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹{dashboard.estimatedProfit.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on current market prices</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {dashboard.expenseByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboard.expenseByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="total"
                    nameKey="category"
                  >
                    {dashboard.expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Harvests</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.upcomingHarvests.length > 0 ? (
              <div className="space-y-4">
                {dashboard.upcomingHarvests.map((harvest) => (
                  <div key={harvest.cropId} className="flex items-center p-3 rounded-lg border bg-card hover-elevate transition-all">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center mr-4">
                      <Calendar className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{harvest.cropName}</h4>
                      <p className="text-sm text-muted-foreground">{harvest.farmName}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="bg-secondary/5 text-secondary border-secondary/20">
                        {format(new Date(harvest.harvestDate), 'MMM d, yyyy')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No upcoming harvests planned.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.recentAlerts.length > 0 ? (
              <div className="space-y-4">
                {dashboard.recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                    <div className={`mt-0.5 rounded-full p-1.5 ${
                      alert.type === 'disease' ? 'bg-red-100 text-red-600' :
                      alert.type === 'weather' ? 'bg-amber-100 text-amber-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {alert.type === 'disease' && <Leaf className="h-4 w-4" />}
                      {alert.type === 'weather' && <CloudSun className="h-4 w-4" />}
                      {alert.type === 'price' && <TrendingUp className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(alert.createdAt), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
                No recent alerts.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
