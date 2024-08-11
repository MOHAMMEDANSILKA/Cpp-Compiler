require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const PORT = process.env.PORT || 3000;
const Groq = require('groq-sdk'); // Import the Groq SDK

const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY }); // Use the API key from the environment variable

app.post('/import', async (req, res) => {
    const { code } = req.body;

    // Frame your question along with the code
    const prompt = `Here is the C++ code:\n${code}\n\nCan you optimize this code and auto complete the code and please only give the code no explenation or any text other than code i only need code in cpp format with proper spacing and in multiple lines copyable format?`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt, // Use the structured prompt
                },
            ],
            model: "llama3-8b-8192", // Use the appropriate model
        });

        // Extract only the optimized code from the response
        const optimizedCode = chatCompletion.choices[0]?.message?.content || "";

        // Send only the optimized code back to the client
        res.json({ optimizedCode });
    } catch (error) {
        console.error("Error sending code to Groq:", error);
        res.status(500).json({ error: 'Failed to get response from Groq.' });
    }
});

app.post('/import', async (req, res) => {
    const { code } = req.body;

    try {
        const response = await axios.post('https://api-inference.huggingface.co/models/EleutherAI/gpt-neo-1.3B', {
            inputs: code,
        }, {
            headers: {
                'Authorization': `Bearer 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`, // Your Hugging Face API token
                'Content-Type': 'application/json'
            }
        });

        // Send the optimized code back to the client
        res.json({ optimizedCode: response.data[0].generated_text });
    } catch (error) {
        console.error("Error sending code to Hugging Face:", error);
        res.status(500).json({ error: 'Failed to get response from Hugging Face.' });
    }
});


app.post('/compile', async (req, res) => {
    const { program, input } = req.body;
    const clientId = '1ef6cf2e2b86e1737dd0a3c7270b9bc2'; // Replace with your Client ID
    const clientSecret = '497f8a962c75c41e385348822c3251328763e2717ade986ecd34b28de70f1e36'; // Replace with your Client Secret

    const data = {
        clientId: clientId,
        clientSecret: clientSecret,
        script: program,
        language: "cpp", // For C++
        versionIndex: "0", // Specify the version index if needed
        stdin: input // Input for the program
    };

    try {
        const response = await axios.post('https://api.jdoodle.com/v1/execute', data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Compilation failed', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
