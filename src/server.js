// Load environment variables from .env file
require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Initialize Express app
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());

// Connect to SQLite database
const db = new sqlite3.Database('./rsvp_db.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});
/*
- this is to clear the database before sending
- used for testing

// Clear database before starting server
db.run('DELETE FROM rsvps', (err) => {
    if (err) console.error('Error clearing RSVPs:', err.message);
});
db.run('DELETE FROM events', (err) => {
    if (err) console.error('Error clearing events:', err.message);
});
*/
// Create tables if they don't exist
db.run(`
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    )
`);
db.run(`
    CREATE TABLE IF NOT EXISTS rsvps (
        rsvp_id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
`);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve HTML page at root
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Create an event
app.post('/create-event', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Event name is required' });
    
    db.run('INSERT INTO events (name) VALUES (?)', [name], function(err) {
        if (err) {
            console.error('Error inserting event:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'Event created', event_id: this.lastID });
    });
});

// RSVP to an event
app.post('/rsvp', (req, res) => {
    const { event_id, name } = req.body;
    if (!event_id || !name) return res.status(400).json({ error: 'Event ID and name are required' });
    
    // Check if event exists before inserting RSVP
    db.get('SELECT id FROM events WHERE id = ?', [event_id], (err, row) => {
        if (err) {
            console.error('Error checking event existence:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(400).json({ error: 'Invalid Event ID' });
        }
        
        db.run('INSERT INTO rsvps (event_id, name) VALUES (?, ?)', [event_id, name], function(err) {
            if (err) {
                console.error('Error inserting RSVP:', err.message);
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ message: 'RSVP confirmed' });
        });
    });
});

// Get all events
app.get('/get-events', (req, res) => {
    db.all('SELECT * FROM events', [], (err, rows) => {
        if (err) {
            console.error('Error fetching events:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ events: rows });
    });
});

// Get RSVPs for a specific event
app.get('/get-rsvps/:eventId', (req, res) => {
    const { eventId } = req.params;
    db.all('SELECT name FROM rsvps WHERE event_id = ?', [eventId], (err, rows) => {
        if (err) {
            console.error('Error fetching RSVPs:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ rsvps: rows });
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});