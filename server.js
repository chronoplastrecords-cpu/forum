const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB using the Render Environment Variable
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB!"))
    .catch(err => console.error("Connection error:", err));

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

const Thread = mongoose.model('Thread', ThreadSchema);

// Routes
app.get('/threads', async (req, res) => {
    const threads = await Thread.find().sort({ timestamp: -1 });
    res.json(threads);
});

app.get('/threads/:id', async (req, res) => {
    const thread = await Thread.findById(req.params.id);
    res.json(thread);
});

app.post('/threads', async (req, res) => {
    const newThread = new Thread(req.body);
    await newThread.save();
    res.status(201).json(newThread);
});

app.post('/threads/:id/replies', async (req, res) => {
    const thread = await Thread.findById(req.params.id);
    thread.replies.push(req.body);
    await thread.save();
    res.status(201).json(thread);
});

const PORT = process.env.PORT || 1000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));