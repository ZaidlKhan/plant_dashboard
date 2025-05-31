const API_URL = 'http://localhost:3001/api';

export async function getTemperatureData() {
    try {
        const response = await fetch(`${API_URL}/temperature`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.map(item => ({
            dateTime: item.timestamp,
            value: item.temperature
        }));
    } catch (error) {
        console.error('Error fetching temperature data:', error);
        return [];
    }
}

export async function getHumidityData() {
    try {
        const response = await fetch(`${API_URL}/humidity`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.map(item => ({
            dateTime: item.timestamp,
            value: item.humidity
        }));
    } catch (error) {
        console.error('Error fetching humidity data:', error);
        return [];
    }
}

export async function getMoistureData() {
    try {
        const response = await fetch(`${API_URL}/moisture`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.map(item => ({
            dateTime: item.timestamp,
            value: item.moisture_percent
        }));
    } catch (error) {
        console.error('Error fetching moisture data:', error);
        return [];
    }
} 