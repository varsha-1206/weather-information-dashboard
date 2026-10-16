
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const cityName = document.getElementById("cityName");
//cityName.textContent = "DOM Practice";
const temperature = document.getElementById("temperature");
const condition = document.getElementById("condition");
const unitToggle = document.getElementById("unitToggle");
let isFahrenheit = false;
let currentTemperatureC = null;
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const feelsLike = document.getElementById("feelsLike");
const forecastContainer = document.getElementById("forecastContainer");
console.log("Weather Dashboard JavaScript loaded");
searchBtn.addEventListener("click", getWeather);
unitToggle.addEventListener("click", function () {
    isFahrenheit = !isFahrenheit;

    if (isFahrenheit) {
        unitToggle.textContent = "Switch to °C";
    } else {
        unitToggle.textContent = "Switch to °F";
    }

    if (currentTemperatureC !== null) {
        const convertedTemp = convertTemperature(currentTemperatureC);
        const unit = isFahrenheit ? "°F" : "°C";

        temperature.textContent = `${convertedTemp.toFixed(1)}${unit}`;
    }
    getWeather();
});
searchBtn.addEventListener("click", function () {
console.log("Search button clicked!");
});
const savedCity = localStorage.getItem("city");
if (savedCity) {
    cityInput.value = savedCity;
}
getWeather();

// Search when the user presses Enter
cityInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        getWeather();
    }
});

async function getWeather() {
    const city = cityInput.value.trim();

    if (city === "") {
        alert("Please enter a city name.");
        cityInput.focus();
        return;
    }

    searchBtn.disabled = true;
    searchBtn.textContent = "Loading...";
    cityName.textContent = "Fetching weather data...";
    condition.textContent = "Fetching current conditions...";
    forecastContainer.innerHTML = "<p>Loading forecast...</p>";

    try {
        // Step 1: Find the city's latitude and longitude
        const geoUrl =
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

        const geoResponse = await fetch(geoUrl);

        if (!geoResponse.ok) {
            throw new Error("Unable to find the city.");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            cityName.textContent = "City not found";
            condition.textContent = "Please enter a valid city name.";
            temperature.textContent = "--°C";
            feelsLike.textContent = "--°C";
            humidity.textContent = "--%";
            wind.textContent = "-- km/h";
            forecastContainer.innerHTML =
                "<p>No forecast available. Try another city.</p>";
            return;
        }

        const location = geoData.results[0];
        const latitude = location.latitude;
        const longitude = location.longitude;

        // Step 2: Fetch current weather information
        const weatherUrl =
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=auto`;

        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
            throw new Error("Unable to fetch current weather.");
        }

        const weatherData = await weatherResponse.json();
        const current = weatherData.current;
        currentTemperatureC = current.temperature_2m;

        if (!current) {
            throw new Error("Current weather data is unavailable.");
        }

        // Step 3: Display current weather
        cityName.textContent = `${location.name}, ${location.country}`;
        localStorage.setItem("city", location.name);
        const convertedTemp = convertTemperature(current.temperature_2m);
const unit = isFahrenheit ? "°F" : "°C";

temperature.textContent = `${convertedTemp.toFixed(1)}${unit}`;
        feelsLike.textContent =
            current.apparent_temperature !== undefined
                ? `${current.apparent_temperature}°C`
                : "Not available";

        humidity.textContent =
            `${current.relative_humidity_2m}%`;

        wind.textContent =
            `${current.wind_speed_10m} km/h`;

        condition.innerHTML = `
    <span class="current-weather-icon">
        ${getWeatherIcon(current.weather_code)}
    </span>
    <span>
        ${getWeatherCondition(current.weather_code)}
    </span>
`;

        // Step 4: Fetch the five-day forecast
        const forecastUrl =
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;

        const forecastResponse = await fetch(forecastUrl);

        if (!forecastResponse.ok) {
            throw new Error("Unable to fetch the forecast.");
        }

        const forecastData = await forecastResponse.json();

        if (forecastData.daily) {
            displayForecast(forecastData.daily);
        } else {
            forecastContainer.innerHTML =
                "<p>Forecast data is unavailable.</p>";
        }

        console.log("Current weather data:", current);

    } catch (error) {
        console.error("Weather dashboard error:", error);

        cityName.textContent = "Unable to load weather";
        condition.textContent =
            "Please check your internet connection and try again.";

        temperature.textContent = "--°C";
        feelsLike.textContent = "--°C";
        humidity.textContent = "--%";
        wind.textContent = "-- km/h";

        forecastContainer.innerHTML =
            "<p>Unable to load the forecast. Please try again.</p>";

    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = "Search";
    }
}

// Display the five-day forecast
function displayForecast(daily) {
    forecastContainer.innerHTML = "";

    for (let i = 0; i < daily.time.length; i++) {
        const date = new Date(daily.time[i] + "T12:00:00");

        const day = date.toLocaleDateString("en-US", {
            weekday: "short"
        });

        const card = document.createElement("div");
        card.className = "forecast-card";

        card.innerHTML = `
            <h3>${day}</h3>
            <p>
    <p class="forecast-condition">
    <span class="weather-icon">${getWeatherIcon(daily.weather_code[i])}</span>
    ${getWeatherCondition(daily.weather_code[i])}
</p>
</p>
            <p>High: ${convertTemperature(daily.temperature_2m_max[i]).toFixed(1)}${isFahrenheit ? "°F" : "°C"}</p>
<p>Low: ${convertTemperature(daily.temperature_2m_min[i]).toFixed(1)}${isFahrenheit ? "°F" : "°C"}</p>
        `;

        forecastContainer.appendChild(card);
    }
}

// Convert weather codes into readable conditions
function getWeatherCondition(code) {
    if (code === 0) return "☀️ Clear Sky";
    if (code === 1) return "🌤️ Mainly Clear";
    if (code === 2) return "⛅ Partly Cloudy";
    if (code === 3) return "☁️ Overcast";
    if (code === 45 || code === 48) return "🌫️ Foggy";

    if ([51, 53, 55, 56, 57].includes(code)) {
        return "🌦️ Drizzle";
    }

    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        return "🌧️ Rainy";
    }

    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return "❄️ Snowy";
    }

    if ([95, 96, 99].includes(code)) {
        return "⛈️ Thunderstorm";
    }

    return "🌡️ Unknown Weather";
}
function convertTemperature(celsius) {
    if (isFahrenheit) {
        return (celsius * 9 / 5) + 32;
    }

    return celsius;
}
function getWeatherIcon(code) {
    if (code === 0) return "☀️";
    if (code === 1) return "🌤️";
    if (code === 2) return "⛅";
    if (code === 3) return "☁️";

    if (code === 45 || code === 48) return "🌫️";

    if ([51, 53, 55, 56, 57].includes(code)) {
        return "🌦️";
    }

    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        return "🌧️";
    }

    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return "❄️";
    }

    if ([95, 96, 99].includes(code)) {
        return "⛈️";
    }

    return "🌡️";
}