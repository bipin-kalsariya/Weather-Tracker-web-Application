class WeatherApp {
    constructor() {
        //API Key
        this.apikey = '3b3a51c07d9d4d27df16c6ff4141aa1d';
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        this.currentUnit = 'metric';
        
        this.initializeEventListners();
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 1000)
    }

    initializeEventListners() {
        document.getElementById('searchBtn').addEventListener('click', () => this.searchWeather());
        document.getElementById('LocationBtn').addEventListener('click', () => this.getCurrentLocation());
        document.getElementById('cityInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter')
                this.searchWeather();
        });

        document.querySelectorAll('.unit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentUnit = e.target.dataset.unit;
                const city = document.getElementById('cityName').textContent;
                if(city !== '--'){
                    this.fetchWeatherByCity(city);
                }
            });
        });
    }

    updateDateTime() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        document.getElementById('datetime').textContent = now.toLocaleString('en-US', options);
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('errorMessage').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showError(message) {
        document.getElementById('errorMessage').textContent =  message;
        document.getElementById("errorMessage").classList.remove('hidden');
        this.hideLoading();
    }

    async searchWeather() {
        const city = document.getElementById('cityInput').value.trim();
        if(!city) {
            this.showError('Please enter a city name');
            return;
        }
        await this.fetchWeatherByCity(city);
    }

    async getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser')
            return;
        }
        
        this.showLoading();
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                await this.fetchWeatherByCoords(latitude, longitude);
            },
            (error) => {
                this.showError('Unable to retrieve your location. Please search for a city instead.')
            }
        );
    }

    async fetchWeatherByCity(city){
        this.showLoading();
        try {
            const response = await fetch(
                `${this.baseUrl}/weather?q=${encodeURIComponent(city)}&appid=${this.apikey}&units=${this.currentUnit}`
            );

            if (!response.ok) {
                throw new Error('City not found')
            }

            const data = await response.json();
            await this.displayWeather(data);
            await this.fetchForecast(data.coord.lat, data.coord.lon);
        } catch (error) {
            this.showError('City not found. Please check the spelling and try again.');
        }
    }

    async fetchWeatherByCoords(lat, lon) {
        try {
            const response = await fetch(
                `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apikey}&units=${this.currentUnit}`
            );

            if (!response.ok) {
                throw new Error('Weather data not available');
            }

            const data = await response.json();
            await this.displayWeather(data);
            await this.fetchForecast(lat, lon);
        } catch (error) {
            this.showError('Unable to fetch weather data for your location')
        }
    }

    async fetchForecast(lat, lon) {
        try {
            const response = await fetch (
                `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apikey}&units=${this.currentUnit}`
            );

            if(!response.ok) {
                throw new Error('Forecast data not available')
            }

            const data = await response.json();
            this.DisplayForecast(data);
        } catch (error) {
            console.error('Forecast error:', error);
        }
    }

    displayWeather(data) {
        this.hideLoading();
        
        const tempUnit = this.currentUnit === 'metric' ? '°C' : '°F';
        const windUnit = this.currentUnit === 'metric' ? 'm/s' : 'mph';

        document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}${tempUnit}`;
        document.getElementById('cityName').textContent = `${data.name}`
        document.getElementById('weatherDescription').textContent = data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);
        document.getElementById('feelsLike').textContent = `Feels like ${Math.round(data.main.feels_like)}${tempUnit}`;
                
        document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
        document.getElementById('humidity').textContent = `${data.main.humidity}%`;
        document.getElementById('windSpeed').textContent = `${data.wind.speed} ${windUnit}`;
        document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
                
        this.setWeatherIcon(data.weather[0].main, data.weather[0].icon);
                
        document.getElementById('weatherMain').classList.remove('hidden');
    }

    setWeatherIcon(weather, iconCode) {
        const iconElement = document.getElementById('weatherIcon');
        const iconMap = {
            'Clear': 'fas fa-sun',
            'Clouds': 'fas fa-cloud',
            'Rain': 'fas fa-cloud-rain',
            'Drizzle': 'fas fa-cloud-showers-heavy',
            'Thunderstorm': 'fas fa-bolt',
            'Snow': 'fas fa-snowflake',
            'Mist': 'fas fa-smog',
            'Smoke': 'fas fa-smog',
            'Haze': 'fas fa-smog',
            'Dust': 'fas fa-smog',
            'Fog': 'fas fa-smog',
            'Sand': 'fas fa-smog',
            'Ash': 'fas fa-smog',
            'Squall': 'fas fa-wind',
            'Tornado': 'fas fa-tornado'
        };

        iconElement.className = iconMap[weather] || 'fas fa-question';
    }

    DisplayForecast(data) {
        const forecastGrid = document.getElementById('forecastGrid');
        forecastGrid.innerHTML = ''; // Clear previous forecast

        const dailyData = this.groupForecastByDay(data.list);
        const tempUnit = this.currentUnit === 'metric' ? '°C' : '°F';

        dailyData.slice(0, 5).forEach(day => {
            const forecastCard = document.createElement('div');
            forecastCard.className = 'forecast-card';

            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            forecastCard.innerHTML = `
                <h4>${dayName}</h4>
                <p>${monthDay}</p>
                <i class="${this.getIconClass(day.weather)}"></i>
                <p><strong>${Math.round(day.maxTemp)}° / ${Math.round(day.minTemp)}°</strong></p>
                <p>${day.weather}</p>
                <small>💧 ${day.humidity}% | 💨 ${day.windSpeed} ${this.currentUnit === 'metric' ? 'm/s' : 'mph'}</small>
            `;

            forecastGrid.appendChild(forecastCard);
        });

        document.getElementById('forecastContainer').classList.remove('hidden');
    }

    groupForecastByDay(list) {
        const grouped = {};
                
        list.forEach(item => {
            const date = new Date(item.dt * 1000).toDateString();
                    
            if (!grouped[date]) {
                grouped[date] = {
                    date: date,
                    temps: [],
                    weather: item.weather[0].main,
                    humidity: item.main.humidity,
                    windSpeed: item.wind.speed
                };
            }
                    
            grouped[date].temps.push(item.main.temp);
        });
                
        return Object.values(grouped).map(day => ({
            ...day,
            maxTemp: Math.max(...day.temps),
            minTemp: Math.min(...day.temps)
        }));
    }

    getIconClass(weather) {
        const iconMap = {
            'Clear': 'fas fa-sun',
            'Clouds': 'fas fa-cloud',
            'Rain': 'fas fa-cloud-rain',
            'Drizzle': 'fas fa-cloud-showers-heavy',
            'Thunderstorm': 'fas fa-bolt',
            'Snow': 'fas fa-snowflake',
            'Mist': 'fas fa-smog',
            'Smoke': 'fas fa-smog',
            'Haze': 'fas fa-smog',
            'Dust': 'fas fa-smog',
            'Fog': 'fas fa-smog',
            'Sand': 'fas fa-smog',
            'Ash': 'fas fa-smog',
            'Squall': 'fas fa-wind',
            'Tornado': 'fas fa-tornado'
        };
        return iconMap[weather] || 'fas fa-question';
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});
