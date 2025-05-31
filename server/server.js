import 'dotenv/config';
import { MongoClient, ServerApiVersion } from 'mongodb';
import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Connect to MongoDB when the server starts
client.connect()
    .catch(err => console.error('Failed to connect to MongoDB:', err));

app.get('/api/temperature', async (req, res) => {
    try {
        const db = client.db("plant");
        const collection = db.collection("temp");

        const data = await collection
            .find()
            .sort({ timestamp: -1 })
            .limit(24)
            .toArray();

        res.json(data);
    } catch (error) {
        console.error('Error fetching temperature data:', error);
        res.status(500).json({ error: 'Failed to fetch temperature data' });
    }
});

app.get('/api/humidity', async (req, res) => {
    try {
        const db = client.db("plant");
        const collection = db.collection("humidity");

        const data = await collection
            .find()
            .sort({ timestamp: -1 })
            .limit(24)
            .toArray();

        res.json(data);
    } catch (error) {
        console.error('Error fetching humidity data:', error);
        res.status(500).json({ error: 'Failed to fetch humidity data' });
    }
});

// API endpoint to get moisture data
app.get('/api/moisture', async (req, res) => {
    try {
        const db = client.db("plant");
        const collection = db.collection("moisture");

        const data = await collection
            .find()
            .sort({ timestamp: -1 })
            .limit(24)
            .toArray();

        res.json(data);
    } catch (error) {
        console.error('Error fetching moisture data:', error);
        res.status(500).json({ error: 'Failed to fetch moisture data' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
