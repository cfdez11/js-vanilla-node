import { reactive, effect } from "../app/services/reactive.js";
import { Component } from "../app/services/component.js";
import { html } from "../app/services/html.js";
import { defineComponent } from "../app/services/decorators.js";

// Códigos meteorológicos
const weatherCodes = {
  0: { description: "Cielo despejado", icon: "☀️", color: "text-yellow-500" },
  1: {
    description: "Mayormente despejado",
    icon: "🌤️",
    color: "text-yellow-400",
  },
  2: {
    description: "Parcialmente nublado",
    icon: "⛅",
    color: "text-gray-400",
  },
  3: { description: "Nublado", icon: "☁️", color: "text-gray-500" },
  45: { description: "Niebla", icon: "🌫️", color: "text-gray-400" },
  48: {
    description: "Niebla con escarcha",
    icon: "🌫️",
    color: "text-blue-300",
  },
  51: { description: "Llovizna ligera", icon: "🌦️", color: "text-blue-400" },
  53: { description: "Llovizna moderada", icon: "🌧️", color: "text-blue-500" },
  55: { description: "Llovizna intensa", icon: "🌧️", color: "text-blue-600" },
  61: { description: "Lluvia ligera", icon: "🌦️", color: "text-blue-500" },
  63: { description: "Lluvia moderada", icon: "🌧️", color: "text-blue-600" },
  65: { description: "Lluvia intensa", icon: "⛈️", color: "text-blue-700" },
  71: { description: "Nieve ligera", icon: "❄️", color: "text-blue-200" },
  73: { description: "Nieve moderada", icon: "🌨️", color: "text-blue-300" },
  75: { description: "Nieve intensa", icon: "❄️", color: "text-blue-400" },
  95: { description: "Tormenta", icon: "⛈️", color: "text-purple-600" },
};

export class Weather extends Component {
  // Estado reactivo
  state = reactive({
    status: "idle", // idle | loading | success | error
    data: null,
    error: null,
    selectedCity: "Madrid",
  });

  // Ciudades disponibles
  cities = {
    Madrid: { lat: 40.4168, lon: -3.7038, timezone: "Europe/Madrid" },
    Barcelona: { lat: 41.3851, lon: 2.1734, timezone: "Europe/Madrid" },
    Londres: { lat: 51.5074, lon: -0.1278, timezone: "Europe/London" },
    "Nueva York": { lat: 40.7128, lon: -74.006, timezone: "America/New_York" },
    París: { lat: 48.8566, lon: 2.3522, timezone: "Europe/Paris" },
    Tokio: { lat: 35.6762, lon: 139.6503, timezone: "Asia/Tokyo" },
  };

  constructor() {
    super();

    // Effect que se ejecuta cuando cambia la ciudad seleccionada
    effect(() => {
      if (this.state.selectedCity) {
        this.fetchWeather(this.state.selectedCity);
      }
    });
  }

  async fetchWeather(cityName) {
    this.state.status = "loading";
    this.state.error = null;

    try {
      const city = this.cities[cityName];
      if (!city) throw new Error(`Ciudad ${cityName} no encontrada`);

      const url =
        "https://api.open-meteo.com/v1/forecast?" +
        new URLSearchParams({
          latitude: city.lat,
          longitude: city.lon,
          current:
            "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
          hourly: "temperature_2m,precipitation_probability,weather_code",
          daily:
            "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
          timezone: city.timezone,
          forecast_days: 5,
        });

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API Error: adasds`);
      }

      const data = await response.json();

      // Procesar datos
      const processedData = {
        location: {
          name: cityName,
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.timezone,
        },
        current: {
          temperature: Math.round(data.current.temperature_2m),
          humidity: data.current.relative_humidity_2m,
          apparentTemperature: Math.round(data.current.apparent_temperature),
          precipitation: data.current.precipitation,
          weatherCode: data.current.weather_code,
          windSpeed: Math.round(data.current.wind_speed_10m * 10) / 10,
          units: data.current_units,
        },
        daily: data.daily.time.slice(0, 5).map((date, index) => ({
          date: new Date(date).toLocaleDateString("es-ES", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }),
          weatherCode: data.daily.weather_code[index],
          tempMax: Math.round(data.daily.temperature_2m_max[index]),
          tempMin: Math.round(data.daily.temperature_2m_min[index]),
          precipitation: data.daily.precipitation_sum[index],
        })),
        hourly: {
          next24h: data.hourly.time.slice(0, 24).map((time, index) => ({
            time: new Date(time).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            temperature: Math.round(data.hourly.temperature_2m[index]),
            precipitation: data.hourly.precipitation_probability[index],
            weatherCode: data.hourly.weather_code[index],
          })),
        },
        lastUpdated: new Date().toLocaleString("es-ES"),
      };

      this.state.data = processedData;
      this.state.status = "success";
    } catch (err) {
      console.warn("Error fetching weather data:", err);
      this.state.status = "error";
      this.state.error = err.message;
      this.state.data = null;
    }
  }

  changeCity(cityName) {
    this.state.selectedCity = cityName;
  }

  getWeatherInfo(code) {
    return (
      weatherCodes[code] || {
        description: "Desconocido",
        icon: "❓",
        color: "text-gray-500",
      }
    );
  }

  render() {
    // Loading state
    if (this.state.status === "loading" || this.state.status === "idle") {
      return html`
        <div class="flex items-center justify-center py-12">
          <div class="text-center space-y-4">
            <div
              class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"
            ></div>
            <p class="text-gray-600">Cargando datos meteorológicos...</p>
          </div>
        </div>
      `;
    }

    // Error state
    if (this.state.status === "error") {
      return html`
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div class="text-red-500 text-4xl mb-4">❌</div>
          <h3 class="text-red-800 font-bold text-lg mb-2">
            Error al cargar el clima
          </h3>
          <p class="text-red-600 mb-4">${this.state.error}</p>
          <button
            @click="${() => this.fetchWeather(this.state.selectedCity)}"
            class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      `;
    }

    const weather = this.state.data;
    if (!weather)
      return html`<div class="text-center py-12">
        No hay datos disponibles
      </div>`;

    const currentWeather = this.getWeatherInfo(weather.current.weatherCode);

    return html`
      <div class="max-w-6xl mx-auto space-y-6">
        <!-- Header con selector de ciudad -->
        <div
          class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white"
        >
          <div
            class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <h1 class="text-3xl font-bold mb-2">
                Clima en ${weather.location.name}
              </h1>
              <p class="text-blue-100">Actualizado: ${weather.lastUpdated}</p>
            </div>

            <div class="flex flex-wrap gap-2">
              ${Object.keys(this.cities).map(
                (city) => html`
                  <button
                    @click="${() => this.changeCity(city)}"
                    class="px-3 py-2 rounded-lg text-sm font-medium transition-all ${this
                      .state.selectedCity === city
                      ? "bg-white text-blue-600"
                      : "bg-blue-600 hover:bg-blue-700 text-white"}"
                  >
                    ${city}
                  </button>
                `
              )}
            </div>
          </div>
        </div>

        <!-- Clima actual -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Temperatura principal -->
          <div
            class="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm font-medium">Temperatura</p>
                <p class="text-3xl font-bold text-gray-800">
                  ${weather.current.temperature}°C
                </p>
                <p class="text-gray-400 text-sm">
                  Sensación: ${weather.current.apparentTemperature}°C
                </p>
              </div>
              <div class="text-4xl ${currentWeather.color}">
                ${currentWeather.icon}
              </div>
            </div>
          </div>

          <!-- Humedad -->
          <div
            class="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm font-medium">Humedad</p>
                <p class="text-3xl font-bold text-gray-800">
                  ${weather.current.humidity}%
                </p>
                <p class="text-gray-400 text-sm">
                  ${currentWeather.description}
                </p>
              </div>
              <div class="text-4xl text-green-500">💧</div>
            </div>
          </div>

          <!-- Viento -->
          <div
            class="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm font-medium">Viento</p>
                <p class="text-3xl font-bold text-gray-800">
                  ${weather.current.windSpeed} km/h
                </p>
                <p class="text-gray-400 text-sm">Velocidad del viento</p>
              </div>
              <div class="text-4xl text-purple-500">💨</div>
            </div>
          </div>

          <!-- Precipitación -->
          <div
            class="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm font-medium">Precipitación</p>
                <p class="text-3xl font-bold text-gray-800">
                  ${weather.current.precipitation} mm
                </p>
                <p class="text-gray-400 text-sm">Actual</p>
              </div>
              <div class="text-4xl text-orange-500">🌧️</div>
            </div>
          </div>
        </div>

        <!-- Pronóstico 5 días -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-bold text-gray-800 mb-4">
            Pronóstico 5 días
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            ${weather.daily.map((day) => {
              const dayWeather = this.getWeatherInfo(day.weatherCode);
              return html`
                <div
                  class="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p class="text-sm font-medium text-gray-600 mb-2">
                    ${day.date}
                  </p>
                  <div class="text-3xl mb-2 ${dayWeather.color}">
                    ${dayWeather.icon}
                  </div>
                  <div class="space-y-1">
                    <p class="text-lg font-bold text-gray-800">
                      ${day.tempMax}°
                    </p>
                    <p class="text-sm text-gray-500">${day.tempMin}°</p>
                    ${day.precipitation > 0
                      ? html`<p class="text-xs text-blue-600">
                          ${day.precipitation}mm
                        </p>`
                      : ""}
                  </div>
                </div>
              `;
            })}
          </div>
        </div>

        <!-- Pronóstico horario (primeras 12 horas) -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-bold text-gray-800 mb-4">
            Próximas 12 horas
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            ${weather.hourly.next24h.slice(0, 12).map((hour) => {
              const hourWeather = this.getWeatherInfo(hour.weatherCode);
              return html`
                <div class="text-center p-3 border border-gray-200 rounded-lg">
                  <p class="text-xs text-gray-500 mb-1">${hour.time}</p>
                  <div class="text-2xl mb-1 ${hourWeather.color}">
                    ${hourWeather.icon}
                  </div>
                  <p class="text-sm font-bold text-gray-800">
                    ${hour.temperature}°
                  </p>
                  ${hour.precipitation > 0
                    ? html`<p class="text-xs text-blue-600">
                        ${hour.precipitation}%
                      </p>`
                    : ""}
                </div>
              `;
            })}
          </div>
        </div>
      </div>
    `;
  }
}

defineComponent("weather")(Weather);
