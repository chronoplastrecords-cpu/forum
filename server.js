const express = require('express');
const cors = require('cors'); // Removed the duplicate require
const fs = require('fs');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'threads.json');

// Ensure the JSON file exists so readData doesn't break
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

const readData = () => {
    try {
        const content = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(content);
    } catch (err) {
        console.error('Failed to read threads file:', err);
        return [];
    }
};

const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('Failed to write threads file:', err);
    }
};

// GET all threads
app.get('/threads', (req, res) => {
    res.json(readData());
});

// GET a single thread by ID (New Feature)
app.get('/threads/:id', (req, res) => {
    const threads = readData();
    const thread = threads.find((t) => t.id === req.params.id);
    
    if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
    }
    res.json(thread);
});

// POST a new thread
app.post('/threads', (req, res) => {
    const { author, title, body } = req.body;
    if (!title || !body) {
        return res.status(400).json({ error: 'Title and body are required' });
    }

    const threads = readData();
    const newThread = {
        id: Date.now().toString(),
        author: author?.trim() || 'Anonymous',
        title: title.trim(),
        body: body.trim(),
        timestamp: Date.now(),
        replies: []
    };

    threads.push(newThread);
    writeData(threads);
    res.status(201).json(newThread);
});

// POST a reply to a thread
app.post('/threads/:id/replies', (req, res) => {
    const { author, text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Reply text is required' });
    }

    const threads = readData();
    const threadIndex = threads.findIndex((t) => t.id === req.params.id);

    if (threadIndex === -1) {
        return res.status(404).json({ error: 'Thread not found' });
    }

    const reply = {
        author: author?.trim() || 'Anonymous',
        text: text.trim(),
        timestamp: Date.now()
    };

    // Ensure replies array exists, then push the new reply
    threads[threadIndex].replies = threads[threadIndex].replies || [];
    threads[threadIndex].replies.push(reply);
    
    writeData(threads);
    res.status(201).json(threads[threadIndex]);
});

// Start the server
const PORT = process.env.PORT || 1000;
app.listen(PORT, () => {
    console.log(`Forum server running on port ${PORT}`);
});