const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = './threads.json';

app.use(cors());
app.use(express.json());

const readData = () => {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE));
};

const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

app.get('/threads', (req, res) => res.json(readData()));

app.post('/threads', (req, res) => {
    const threads = readData();
    const newThread = { id: Date.now().toString(), ...req.body, timestamp: Date.now(), replies: [] };
    threads.push(newThread);
    writeData(threads);
    res.json(newThread);
});

app.post('/threads/:id/replies', (req, res) => {
    const threads = readData();
    const thread = threads.find(t => t.id === req.params.id);
    if (thread) {
        thread.replies.push({ ...req.body, timestamp: Date.now() });
        writeData(threads);
        res.json(thread);
    } else {
        res.status(404).send('Not found');
    }
});

app.listen(PORT, () => console.log(`Server live on port ${PORT}`));