import { useState, useMemo } from 'react';
import { 
  useListMarketPrices,
  useListAvailableCrops,
  useListPricePredictions
} from '@workspace/api-client-react';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, IndianRupee, Search, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';

export default function MarketPrices() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<string>('wheat'); // Default to trigger prediction fetch
  
  const { data: availableCrops, isLoading: cropsLoading } = useListAvailableCrops();
  
  const { data: prices, isLoading: pricesLoading } = useListMarketPrices({
    crop: searchTerm || undefined
  });

  const { data: prediction, isLoading: predictionLoading } = useListPricePredictions(
    { crop: selectedCrop },
    { query: { enabled: !!selectedCrop } }
  );

  const filteredPrices = useMemo(() => {
    if (!prices) return [];
    return prices;
  }, [prices]);

  const chartData = useMemo(() => {
    if (!prediction) return [];
    const hist = prediction.historical.map(d => ({ date: format(new Date(d.date), 'MMM d'), price: d.price, type: 'Historical' }));
    const pred = prediction.predicted.map(d => ({ date: format(new Date(d.date), 'MMM d'), predictedPrice: d.price, type: 'Predicted' }));
    
    // Combine them, keeping dates ordered. Simplified approach.
    return [...hist, ...pred];
  }, [prediction]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          Market Intel
        </h1>
        <p className="text-muted-foreground mt-1">Live mandi prices and AI-driven price forecasting.</p>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="live">Live Mandi Prices</TabsTrigger>
          <TabsTrigger value="forecast">Price Forecast</TabsTrigger>
        </TabsList>
        
        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <CardTitle>Current Rates</CardTitle>
                  <CardDescription>Daily prices across APMC markets</CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input 
                    placeholder="Search crops..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pricesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : filteredPrices.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No prices found for "{searchTerm}".
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <div className="grid grid-cols-4 sm:grid-cols-5 bg-muted/50 p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-2 sm:col-span-2">Crop / Market</div>
                    <div className="text-right hidden sm:block">Min</div>
                    <div className="text-right hidden sm:block">Max</div>
                    <div className="text-right col-span-2 sm:col-span-1">Modal Price</div>
                  </div>
                  <div className="divide-y max-h-[600px] overflow-y-auto">
                    {filteredPrices.map((item) => (
                      <div key={item.id} className="grid grid-cols-4 sm:grid-cols-5 p-3 items-center hover:bg-muted/20 transition-colors">
                        <div className="col-span-2 sm:col-span-2">
                          <p className="font-bold text-foreground capitalize flex items-center gap-2">
                            {item.cropName} 
                            {item.variety && <Badge variant="secondary" className="text-[10px] h-4 px-1">{item.variety}</Badge>}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" /> {item.market}, {item.state}
                          </p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground hidden sm:block">₹{item.minPrice}</div>
                        <div className="text-right text-sm text-muted-foreground hidden sm:block">₹{item.maxPrice}</div>
                        <div className="text-right col-span-2 sm:col-span-1">
                          <p className="font-bold text-primary">₹{item.modalPrice}</p>
                          <p className="text-[10px] text-muted-foreground">per {item.unit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="forecast" className="space-y-4">
          <div className="flex justify-end mb-2">
            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select crop" />
              </SelectTrigger>
              <SelectContent>
                {cropsLoading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : availableCrops?.map((crop) => (
                  <SelectItem key={crop} value={crop} className="capitalize">{crop}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {predictionLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-32 md:col-span-1" />
              <Skeleton className="h-32 md:col-span-2" />
              <Skeleton className="h-[400px] md:col-span-3" />
            </div>
          ) : !prediction ? (
            <Card className="py-12 flex items-center justify-center">
              <p className="text-muted-foreground">Select a crop to view forecasts.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1 bg-gradient-to-br from-card to-muted/30">
                <CardHeader>
                  <CardTitle className="text-lg">Price Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-full ${
                      prediction.trend === 'rising' ? 'bg-green-100 text-green-600' :
                      prediction.trend === 'falling' ? 'bg-red-100 text-red-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {prediction.trend === 'rising' && <TrendingUp className="h-8 w-8" />}
                      {prediction.trend === 'falling' && <TrendingDown className="h-8 w-8" />}
                      {prediction.trend === 'stable' && <Minus className="h-8 w-8" />}
                    </div>
                    <div>
                      <p className="text-3xl font-bold capitalize">{prediction.trend}</p>
                      <p className="text-sm text-muted-foreground">Next 30 days</p>
                    </div>
                  </div>
                  <div className="mt-8 pt-4 border-t space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Best Selling Month</p>
                      <p className="font-medium">{prediction.bestSellingMonth}</p>
                    </div>
                    {prediction.avgPrice && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Current Avg Price</p>
                        <p className="font-medium">₹{prediction.avgPrice} / Qtl</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">30-Day Forecast Model</CardTitle>
                  <CardDescription className="capitalize">{prediction.cropName}</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} domain={['auto', 'auto']} />
                      <Tooltip formatter={(val: number) => `₹${val}`} />
                      <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorHistorical)" name="Historical Price" connectNulls />
                      <Area type="monotone" dataKey="predictedPrice" stroke="hsl(var(--secondary))" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPredicted)" name="Forecasted Price" connectNulls />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
