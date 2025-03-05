require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',  // Use .env instead of hardcoding
    database: process.env.DB_NAME || 'rsvp_db'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    } else {
        console.log('Connected to MySQL');
    }
});

// Serve the homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Create an event
app.post('/create-event', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Event name is required' });

    console.log('Creating event:', name);
    db.query('INSERT INTO events (name) VALUES (?)', [name], (err, result) => {
        if (err) {
            console.error('Error inserting event:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'Event created', eventId: result.insertId });
    });
});

// RSVP to an event
app.post('/rsvp', (req, res) => {
    const { event_id, name } = req.body;
    if (!event_id || !name) return res.status(400).json({ error: 'Event ID and name are required' });

    console.log(`RSVP: ${name} for event ${event_id}`);
    db.query('INSERT INTO rsvps (event_id, name) VALUES (?, ?)', [event_id, name], (err, result) => {
        if (err) {
            console.error('Error inserting RSVP:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'RSVP confirmed' });
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
