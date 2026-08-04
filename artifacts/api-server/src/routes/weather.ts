import { Router, type IRouter } from "express";
import { requireDbUser } from "../lib/auth";
import { GetWeatherQueryParams } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const WMO_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Icy fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  80: "Slight showers",
  81: "Moderate showers",
  82: "Violent showers",
  85: "Snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};

function getWeatherDescription(code: number): string {
  return WMO_CODES[code] ?? "Unknown";
}

function getFarmingAdvice(current: { temperature: number; humidity: number; precipitation: number; weatherCode: number }): string[] {
  const advice: string[] = [];
  const { temperature, humidity, precipitation, weatherCode } = current;

  if (temperature > 38) {
    advice.push("Extreme heat alert: water crops early morning or evening to reduce evaporation and heat stress.");
  } else if (temperature < 10) {
    advice.push("Cold weather: protect frost-sensitive crops with covers. Delay sowing until temperatures improve.");
  }

  if (humidity > 80) {
    advice.push("High humidity increases fungal disease risk. Monitor crops closely and apply fungicides preventively.");
  } else if (humidity < 30) {
    advice.push("Low humidity: increase irrigation frequency. Mulch around plants to retain soil moisture.");
  }

  if (precipitation > 20) {
    advice.push("Heavy rain expected: ensure good field drainage to prevent waterlogging and root rot.");
  } else if (precipitation > 5) {
    advice.push("Moderate rainfall: good conditions for fertilizer application after rain stops.");
  } else if (precipitation < 1) {
    advice.push("Dry conditions: check soil moisture and irrigate if needed, especially for growing crops.");
  }

  if ([61, 63, 65, 80, 81, 82].includes(weatherCode)) {
    advice.push("Rain in forecast: delay pesticide spraying — rain will wash away chemical treatments.");
  }

  if ([95, 96, 99].includes(weatherCode)) {
    advice.push("Thunderstorm warning: secure equipment and stay indoors. Do not operate machinery.");
  }

  if (advice.length === 0) {
    advice.push("Weather conditions are favorable for routine farm operations.");
  }

  return advice;
}

router.get("/weather", requireDbUser, async (req, res): Promise<void> => {
  const params = GetWeatherQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { latitude, longitude, location } = params.data;

  const apiUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code` +
    `&timezone=auto&forecast_days=7`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }
    const data = (await response.json()) as {
      current: {
        temperature_2m: number;
        relative_humidity_2m: number;
        wind_speed_10m: number;
        weather_code: number;
        precipitation: number;
      };
      daily: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_sum: number[];
        weather_code: number[];
      };
    };

    const current = {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windspeed: data.current.wind_speed_10m,
      weatherCode: data.current.weather_code,
      description: getWeatherDescription(data.current.weather_code),
    };

    const daily = data.daily.time.map((date, i) => ({
      date,
      tempMax: data.daily.temperature_2m_max[i] ?? 0,
      tempMin: data.daily.temperature_2m_min[i] ?? 0,
      precipitation: data.daily.precipitation_sum[i] ?? 0,
      weatherCode: data.daily.weather_code[i] ?? 0,
      description: getWeatherDescription(data.daily.weather_code[i] ?? 0),
    }));

    const farmingAdvice = getFarmingAdvice({
      temperature: current.temperature,
      humidity: current.humidity,
      precipitation: data.current.precipitation,
      weatherCode: current.weatherCode,
    });

    res.json({
      location: location ?? `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
      current,
      daily,
      farmingAdvice,
    });
  } catch (err) {
    logger.error({ err }, "Weather API error");
    res.status(502).json({ error: "Could not fetch weather data" });
  }
});

export default router;
