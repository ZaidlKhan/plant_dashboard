const now = new Date();

export function getSensorData(collectionName, limit = 24) {
    // Generate mock data based on the collection type
    let min, max;
    switch (collectionName) {
        case 'moisture':
            min = 50;
            max = 90;
            break;
        case 'temperature':
            min = 20;
            max = 28;
            break;
        case 'humidity':
            min = 30;
            max = 100;
            break;
        default:
            min = 0;
            max = 100;
    }

    // Generate mock data points
    const data = Array.from({ length: limit }, (_, i) => ({
        dateTime: new Date(now.getTime() - (limit - i - 1) * 3 * 60 * 60 * 1000).toISOString(),
        value: Math.floor(Math.random() * (max - min + 1)) + min
    }));

    return data;
} 