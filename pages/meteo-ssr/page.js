export async function getData() {
  // API Open-Meteo to get current weather in Madrid, Spain (latitude: 40.4168, longitude: -3.7038)
  const weatherUrl =
    "https://api.open-meteo.com/v1/forecast?" +
    new URLSearchParams({
      latitude: 40.4168,
      longitude: -3.7038,
      current:
        "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
      hourly: "temperature_2m,precipitation_probability,weather_code",
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
      timezone: "Europe/Madrid",
      forecast_days: 7,
    });

  const weatherResponse = await fetch(weatherUrl);

  if (!weatherResponse.ok) {
    throw new Error(`Weather API error: ${weatherResponse.status}`);
  }

  const weatherData = await weatherResponse.json();

  const processedData = {
    location: {
      latitude: weatherData.latitude,
      longitude: weatherData.longitude,
      timezone: weatherData.timezone,
      city: "Madrid, España",
    },
    current: {
      temperature: weatherData.current.temperature_2m,
      humidity: weatherData.current.relative_humidity_2m,
      apparentTemperature: weatherData.current.apparent_temperature,
      precipitation: weatherData.current.precipitation,
      weatherCode: weatherData.current.weather_code,
      windSpeed: weatherData.current.wind_speed_10m,
      unit: weatherData.current_units,
    },
    daily: weatherData.daily.time.map((date, index) => ({
      date,
      weatherCode: weatherData.daily.weather_code[index],
      tempMax: weatherData.daily.temperature_2m_max[index],
      tempMin: weatherData.daily.temperature_2m_min[index],
      precipitation: weatherData.daily.precipitation_sum[index],
    })),
    hourly: {
      times: weatherData.hourly.time.slice(0, 24), // Próximas 24 horas
      temperatures: weatherData.hourly.temperature_2m.slice(0, 24),
      precipitation: weatherData.hourly.precipitation_probability.slice(0, 24),
      weatherCodes: weatherData.hourly.weather_code.slice(0, 24),
    },
  };

  return processedData;
}

export function getWeatherInfo(code) {
  return weatherCodes[code] || { description: "Unknown", icon: "❓" };
}

export const metadata = {
  title: "Meteo SSR - Open Meteo",
  description:
    "Meteo SSR page fetching real-time weather data using Open-Meteo API",
};
