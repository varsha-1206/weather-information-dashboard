
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const condition = document.getElementById("condition");
const unitToggle = document.getElementById("unitToggle");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const feelsLike = document.getElementById("feelsLike");
const forecastContainer = document.getElementById("forecastContainer");

const currentIcon = document.getElementById("currentIcon");
const lastSearched = document.querySelector(".last-searched");
const messageTitle = document.querySelector(".weather-message-card h2");
const messageText = document.querySelector(".weather-message-card p");

let isFahrenheit = false;
let currentTemperatureC = null;
let feelsLikeC = null;
let lastDailyForecast = null;

console.log("Weather Dashboard JavaScript loaded");

// Search button
searchBtn.addEventListener("click", getWeather);

// Celsius / Fahrenheit toggle
unitToggle.addEventListener("click", function () {
    isFahrenheit = !isFahrenheit;

    unitToggle.textContent = isFahrenheit
        ? "Switch to °C"
        : "Switch to °F";

    if (currentTemperatureC !== null) {
        temperature.textContent =
            `${convertTemperature(currentTemperatureC).toFixed(1)}${isFahrenheit ? "°F" : "°C"}`;
    }

    updateFeelsLike();

    if (lastDailyForecast) {
        displayForecast(lastDailyForecast);
    }
});

// Search when Enter is pressed
cityInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        getWeather();
    }
});

// Load the last searched city
const savedCity = localStorage.getItem("city");

if (savedCity) {
    cityInput.value = savedCity;
}

getWeather();

// Fetch weather information
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
        // Step 1: Find the city
        const geoUrl =
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

        const geoResponse = await fetch(geoUrl);

        if (!geoResponse.ok) {
            throw new Error("Unable to find the city.");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            currentTemperatureC = null;
            feelsLikeC = null;
            lastDailyForecast = null;

            cityName.textContent = "City not found";
            condition.textContent = "Please enter a valid city name.";
            temperature.textContent = "--";
            feelsLike.textContent = "--";
            humidity.textContent = "--";
            wind.textContent = "--";
            forecastContainer.innerHTML =
                "<p>No forecast available. Try another city.</p>";

            if (currentIcon) {
                currentIcon.textContent = "🌍";
            }

            if (messageTitle && messageText) {
                messageTitle.textContent = "City not found";
                messageText.textContent =
                    "Please check the spelling and try another city.";
            }

            return;
        }

        const location = geoData.results[0];
        const latitude = location.latitude;
        const longitude = location.longitude;

        // Step 2: Fetch current weather
        const weatherUrl =
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=auto`;

        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
            throw new Error("Unable to fetch current weather.");
        }

        const weatherData = await weatherResponse.json();
        const current = weatherData.current;

        if (!current) {
            throw new Error("Current weather data is unavailable.");
        }

        currentTemperatureC = current.temperature_2m;
        feelsLikeC = current.apparent_temperature;

        // Step 3: Display current weather
        cityName.textContent = location.name;
        localStorage.setItem("city", location.name);

        if (lastSearched) {
            lastSearched.innerHTML =
                `<span>📍</span><span>Last searched: ${location.name}</span>`;
        }

        temperature.textContent =
            `${convertTemperature(currentTemperatureC).toFixed(1)}${isFahrenheit ? "°F" : "°C"}`;

        updateFeelsLike();

        humidity.textContent =
            `${current.relative_humidity_2m}%`;

        wind.textContent =
            `${current.wind_speed_10m} km/h`;

        // Update the weather condition and icon
        const weatherIcon = getWeatherIcon(current.weather_code);
        const weatherDescription =
            getWeatherCondition(current.weather_code);

        if (currentIcon) {
            currentIcon.textContent = weatherIcon;
        }

        condition.innerHTML = `
            <span>${weatherDescription}</span>
        `;

        // Update the message card
        updateWeatherMessage(
            current.weather_code,
            location.name,
            current.is_day
        );

        // Step 4: Fetch five-day forecast
        const forecastUrl =
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;

        const forecastResponse = await fetch(forecastUrl);

        if (!forecastResponse.ok) {
            throw new Error("Unable to fetch the forecast.");
        }

        const forecastData = await forecastResponse.json();

        if (forecastData.daily) {
            lastDailyForecast = forecastData.daily;
            displayForecast(lastDailyForecast);
        } else {
            lastDailyForecast = null;
            forecastContainer.innerHTML =
                "<p>Forecast data is unavailable.</p>";
        }

        console.log("Current weather data:", current);

    } catch (error) {
        console.error("Weather dashboard error:", error);

        cityName.textContent = "Unable to load weather";
        condition.textContent =
            "Please check your internet connection and try again.";

        temperature.textContent = "--";
        feelsLike.textContent = "--";
        humidity.textContent = "--";
        wind.textContent = "--";

        if (currentIcon) {
            currentIcon.textContent = "🌐";
        }

        lastDailyForecast = null;

        forecastContainer.innerHTML =
            "<p>Unable to load the forecast. Please try again.</p>";

        if (messageTitle && messageText) {
            messageTitle.textContent = "Weather unavailable";
            messageText.textContent =
                "Please check your internet connection and try again.";
        }

    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = "⌕ Search";
    }
}

// Convert Celsius to Fahrenheit when selected
function convertTemperature(celsius) {
    if (isFahrenheit) {
        return (celsius * 9 / 5) + 32;
    }

    return celsius;
}

// Update the feels-like temperature
function updateFeelsLike() {
    if (feelsLikeC === null || !Number.isFinite(Number(feelsLikeC))) {
        feelsLike.textContent = "--";
        return;
    }

    feelsLike.textContent =
        `${convertTemperature(Number(feelsLikeC)).toFixed(1)}${isFahrenheit ? "°F" : "°C"}`;
}

// Update the message card according to the weather
function updateWeatherMessage(code, city, isDay) {
    if (!messageTitle || !messageText) {
        return;
    }

    if ([95, 96, 99].includes(code)) {
        messageTitle.textContent = "Thunderstorms expected";
        messageText.textContent =
            `Be careful outdoors and check the latest conditions in ${city}.`;
    } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        messageTitle.textContent = "Rainy weather today";
        messageText.textContent =
            `Consider carrying an umbrella when going out in ${city}.`;
    } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
        messageTitle.textContent = "Cold and snowy weather";
        messageText.textContent =
            `Check local conditions before travelling in ${city}.`;
    } else if ([45, 48].includes(code)) {
        messageTitle.textContent = "Foggy conditions";
        messageText.textContent =
            `Take care while travelling in ${city}.`;
    } else if (code === 0 || code === 1 || code === 2) {
        messageTitle.textContent = isDay
            ? "Good weather for today!"
            : "Clear skies tonight";

        messageText.textContent =
            `Enjoy the weather in ${city}.`;
    } else {
        messageTitle.textContent = "Today's weather update";
        messageText.textContent =
            `Stay updated with the latest weather in ${city}.`;
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

        const dateText = date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "short"
        });

        const high = convertTemperature(daily.temperature_2m_max[i]);
        const low = convertTemperature(daily.temperature_2m_min[i]);
        const unit = isFahrenheit ? "°F" : "°C";

        const card = document.createElement("div");
        card.className = "forecast-card";

        card.innerHTML = `
            <h3>${day}</h3>
            <p>${dateText}</p>

            <p class="forecast-condition">
                <span class="weather-icon">
                    ${getWeatherIcon(daily.weather_code[i])}
                </span>
                <span>${getWeatherCondition(daily.weather_code[i])}</span>
            </p>

            <p class="forecast-temperature">
                <strong>${high.toFixed(0)}°</strong>
                / ${low.toFixed(0)}°
                ${isFahrenheit ? "F" : "C"}
            </p>
        `;

        forecastContainer.appendChild(card);
    }
}

// Convert Open-Meteo weather codes to readable conditions
function getWeatherCondition(code) {
    if (code === 0) return "Clear Sky";
    if (code === 1) return "Mainly Clear";
    if (code === 2) return "Partly Cloudy";
    if (code === 3) return "Overcast";
    if (code === 45 || code === 48) return "Foggy";

    if ([51, 53, 55, 56, 57].includes(code)) {
        return "Drizzle";
    }

    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        return "Rainy";
    }

    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return "Snowy";
    }

    if ([95, 96, 99].includes(code)) {
        return "Thunderstorm";
    }

    return "Unknown Weather";
}

// Return an icon for each weather condition
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
