-- Create the events table to store all our events
-- Each event has a unique ID and a name
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Auto-incrementing ID ensures each event gets a unique identifier
    name VARCHAR(255) NOT NULL          -- Event name is required - can't have an unnamed event!
);

-- Create the RSVPs table to store all responses to events
-- Links each RSVP to a specific event using foreign key relationship
CREATE TABLE rsvps (
    rsvp_id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique ID for each RSVP
    event_id INT NOT NULL,                   -- Which event this RSVP is for
    name VARCHAR(255) NOT NULL,              -- Name of the person who RSVP'd
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE  -- If event is deleted, also delete related RSVPs
);