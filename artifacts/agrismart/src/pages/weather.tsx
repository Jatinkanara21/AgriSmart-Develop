import { useState, useEffect } from 'react';
import { useGetWeather } from '@workspace/api-client-react';
import { format } from 'date-fns';
import { 
  CloudSun, 
  CloudRain, 
  Sun, 
  Cloud, 
  Wind, 
  Droplets, 
  MapPin, 
  Navigation,
  Thermometer,
  Leaf
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Default to Ahmedabad, Gujarat
const DEFAULT_LAT = 23.0225;
const DEFAULT_LNG = 72.5714;

export default function Weather() {
  const { toast } = useToast();
  
  const [coords, setCoords] = useState<{lat: number, lng: number}>({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [isLocating, setIsLocating] = useState(false);

  const { data: weather, isLoading } = useGetWeather({
    latitude: coords.lat,
    longitude: coords.lng
  });

  const getLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      toast({ title: 'Geolocation is not supported by your browser', variant: 'destructive' });
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
        toast({ title: 'Location updated successfully' });
      },
      (error) => {
        console.error(error);
        toast({ title: 'Unable to retrieve your location. Using default.', variant: 'destructive' });
        setIsLocating(false);
      }
    );
  };

  const getWeatherIcon = (code: number, className = "w-6 h-6") => {
    // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
    if (code === 0) return <Sun className={`${className} text-amber-500`} />;
    if (code >= 1 && code <= 3) return <CloudSun className={`${className} text-sky-500`} />;
    if (code >= 45 && code <= 48) return <Cloud className={`${className} text-slate-400`} />;
    if (code >= 51 && code <= 67) return <CloudRain className={`${className} text-blue-400`} />;
    if (code >= 71 && code <= 82) return <CloudRain className={`${className} text-blue-600`} />;
    if (code >= 95 && code <= 99) return <CloudRain className={`${className} text-purple-500`} />;
    return <Sun className={`${className} text-amber-500`} />;
  };

  const tempChartData = weather?.daily?.map(d => ({
    date: format(new Date(d.date), 'MMM d'),
    max: d.tempMax,
    min: d.tempMin
  })) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CloudSun className="h-8 w-8 text-primary" />
            Hyperlocal Weather
          </h1>
          <p className="text-muted-foreground mt-1">Forecasts and farming advice for your location.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={getLocation} 
          disabled={isLocating}
          className="bg-background"
        >
          {isLocating ? (
            <span className="flex items-center"><Navigation className="mr-2 h-4 w-4 animate-spin" /> Locating...</span>
          ) : (
            <span className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-primary" /> Use My Location</span>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 md:col-span-1" />
          <Skeleton className="h-64 md:col-span-2" />
          <Skeleton className="h-48 md:col-span-3" />
        </div>
      ) : !weather ? (
        <Card className="py-12 flex items-center justify-center text-muted-foreground">
          Unable to load weather data.
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Current Weather */}
          <Card className="md:col-span-1 bg-gradient-to-br from-sky-500 to-blue-600 text-white border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-medium text-sky-100 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" /> {weather.location}
                  </h3>
                  <p className="text-xs text-sky-200 mt-1">Currently</p>
                </div>
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  {getWeatherIcon(weather.current.weatherCode, "h-10 w-10 text-white")}
                </div>
              </div>
              
              <div className="mb-8">
                <div className="text-6xl font-bold tracking-tighter">
                  {Math.round(weather.current.temperature)}°
                </div>
                <p className="text-xl font-medium text-sky-100 mt-1 capitalize">
                  {weather.current.description}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
                <div className="flex items-center gap-2">
                  <Wind className="h-5 w-5 text-sky-200" />
                  <div>
                    <p className="text-xs text-sky-200">Wind</p>
                    <p className="font-medium">{weather.current.windspeed} km/h</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-sky-200" />
                  <div>
                    <p className="text-xs text-sky-200">Humidity</p>
                    <p className="font-medium">{weather.current.humidity}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Farming Advice */}
          <Card className="md:col-span-2 bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <Leaf className="h-5 w-5 mr-2" /> Agronomist Advice
              </CardTitle>
              <CardDescription>Based on the 7-day forecast</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {weather.farmingAdvice.map((advice, i) => (
                  <li key={i} className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mr-3 mt-0.5">
                      <span className="text-xs font-bold">{i+1}</span>
                    </div>
                    <p className="text-foreground leading-relaxed">{advice}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 7-Day Forecast */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>7-Day Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4 mb-8">
                {weather.daily.map((day, i) => (
                  <div key={i} className="flex flex-col items-center p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      {i === 0 ? 'Today' : format(new Date(day.date), 'EEE')}
                    </p>
                    {getWeatherIcon(day.weatherCode, "h-8 w-8 mb-3")}
                    <div className="flex gap-3 text-sm font-bold">
                      <span className="text-foreground">{Math.round(day.tempMax)}°</span>
                      <span className="text-muted-foreground">{Math.round(day.tempMin)}°</span>
                    </div>
                    {day.precipitation > 0 && (
                      <div className="flex items-center text-xs text-blue-500 mt-2 font-medium">
                        <Droplets className="h-3 w-3 mr-0.5" /> {day.precipitation}mm
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tempChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={val => `${val}°`} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip formatter={(val) => `${val}°C`} />
                    <Area type="monotone" dataKey="max" stroke="#f59e0b" fillOpacity={1} fill="url(#colorMax)" name="High" />
                    <Area type="monotone" dataKey="min" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMin)" name="Low" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
