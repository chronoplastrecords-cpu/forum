const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- CONNECT TO MONGODB ---
// Replace <db_password> with your actual database password!
const mongoURI = "mongodb+srv://cameronjamesbatista_db_user:<db_password>@forum.fa95vhy.mongodb.net/?appName=Forum";

mongoose.connect(mongoURI)
    .then(() => console.log("Connected to MongoDB Vault!"))
    .catch(err => console.error("Database connection error:", err));

// --- DATA BLUEPRINTS (Schemas) ---

const ThreadSchema = new mongoose.Schema({
    author: { type: String, default: 'Anonymous' },
    title: String,
    body: String,
    timestamp: { type: Date, default: Date.now },
    replies: [{ 
        author: { type: String, default: 'Anonymous' }, 
        text: String, 
        timestamp: { type: Date, default: Date.now } 
    }]
});

const BandSchema = new mongoose.Schema({
    name: String,
    genre: String,
    country: String,
    years: String,
    status: String,
    members: String,
    description: String,
    slug: { type: String, unique: true },
    albums: [{ 
        title: String, 
        year: String, 
        slug: String, 
        tracks: Array 
    }]
});

const Thread = mongoose.model('Thread', ThreadSchema);
const Band = mongoose.model('Band', BandSchema);

// ==========================================
//               FORUM ROUTES
// ==========================================

// Get all threads
app.get('/threads', async (req, res) => {
    try {
        const threads = await Thread.find().sort({ timestamp: -1 });
        res.json(threads);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch threads" });
    }
});

// Get single thread
app.get('/threads/:id', async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.id);
        res.json(thread);
    } catch (err) {
        res.status(404).json({ error: "Thread not found" });
    }
});

// Post new thread
app.post('/threads', async (req, res) => {
    try {
        const newThread = new Thread(req.body);
        await newThread.save();
        res.status(201).json(newThread);
    } catch (err) {
        res.status(400).json({ error: "Failed to create thread" });
    }
});

// Post reply
app.post('/threads/:id/replies', async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.id);
        thread.replies.push(req.body);
        await thread.save();
        res.status(201).json(thread);
    } catch (err) {
        res.status(400).json({ error: "Failed to add reply" });
    }
});

// ==========================================
//               CRYPT ROUTES
// ==========================================

// Get all bands
app.get('/bands', async (req, res) => {
    try {
        const bands = await Band.find();
        res.json(bands);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch bands" });
    }
});

// Post new band
app.post('/bands', async (req, res) => {
    try {
        const newBand = new Band(req.body);
        await newBand.save();
        res.status(201).json(newBand);
    } catch (err) {
        res.status(400).json({ error: "Failed to create band" });
    }
});

// Edit band (Update)
app.put('/bands/:slug', async (req, res) => {
    try {
        const updatedBand = await Band.findOneAndUpdate(
            { slug: req.params.slug }, 
            req.body, 
            { new: true }
        );
        res.json(updatedBand);
    } catch (err) {
        res.status(400).json({ error: "Failed to update band" });
    }
});

// Add album to band
app.post('/bands/:slug/albums', async (req, res) => {
    try {
        const band = await Band.findOne({ slug: req.params.slug });
        band.albums.push(req.body);
        await band.save();
        res.status(201).json(req.body);
    } catch (err) {
        res.status(400).json({ error: "Failed to add album" });
    }
});

// Start the server
const PORT = process.env.PORT || 1000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});