// Load environment variables from .env file - helps keep sensitive info out of code
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Initialize Express app
const app = express();

// Enable CORS for all routes - needed for frontend to talk to our API
app.use(cors({ origin: true, credentials: true }));

// Parse JSON request bodies
app.use(bodyParser.json());

// Database connection configuration
// Using environment variables with fallbacks for local development
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Theproisback123',  // Note: In production, never hardcode passwords!
    database: process.env.DB_NAME || 'rsvp_db'
});

// Connect to MySQL and handle connection errors
db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);  // Exit if we can't connect to the database - no point continuing
    } else {
        console.log('Connected to MySQL');
    }
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve our main HTML page at the root URL
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to create a new event
app.post('/create-event', (req, res) => {
    const { name } = req.body;
    
    // Basic validation - ensure event name is provided
    if (!name) return res.status(400).json({ error: 'Event name is required' });

    // Insert the new event into the database
    db.query('INSERT INTO events (name) VALUES (?)', [name], (err, result) => {
        if (err) {
            console.error('Error inserting event:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Return success with the new event ID for reference
        res.status(201).json({ message: 'Event created', event_id: result.insertId });
    });
});

// API endpoint to RSVP to an event
app.post('/rsvp', (req, res) => {
    const { event_id, name } = req.body;
    
    // Ensure both event ID and name are provided
    if (!event_id || !name) return res.status(400).json({ error: 'Event ID and name are required' });

    // Insert the RSVP into the database
    db.query('INSERT INTO rsvps (event_id, name) VALUES (?, ?)', [event_id, name], (err, result) => {
        if (err) {
            console.error('Error inserting RSVP:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Return success message
        res.status(201).json({ message: 'RSVP confirmed' });
    });
});

// API endpoint to get all events
app.get('/get-events', (req, res) => {
    db.query('SELECT * FROM events', (err, results) => {
        if (err) {
            console.error('Error fetching events:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Return the list of events
        res.json({ events: results });
    });
});

// API endpoint to get RSVPs for a specific event
app.get('/get-rsvps/:eventId', (req, res) => {
    const { eventId } = req.params;
    
    // Query RSVPs by event ID
    db.query('SELECT name FROM rsvps WHERE event_id = ?', [eventId], (err, results) => {
        if (err) {
            console.error('Error fetching RSVPs:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Return the list of RSVPs
        res.json({ rsvps: results });
    });
});

// Database setup - create events table if it doesn't exist
// This makes the app self-initializing, great for first-time setup!
db.query(`
    CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL
    )
`, (err) => {
    if (err) console.error('Error creating events table:', err);
});

// Create RSVPs table if it doesn't exist
// Foreign key ensures referential integrity - RSVPs must link to valid events
db.query(`
    CREATE TABLE IF NOT EXISTS rsvps (
        rsvp_id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
`, (err) => {
    if (err) console.error('Error creating RSVPs table:', err);
});

/*
* Commented out data reset code - useful for testing but would wipe all data
* Leaving this here for development purposes, but commented out for safety
*
db.query(
    `DELETE FROM rsvps;`, (err) => {
        if (err) console.error('Error creating RSVPs table:', err);
    }
);
db.query(
    `DELETE FROM events;`, (err) => {
        if (err) console.error('Error creating RSVPs table:', err);
    }
);
*/

// Start the server on the specified port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});