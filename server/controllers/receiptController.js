const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
require('dotenv').config();

const scanReceipt = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const imagePath = req.file.path;
        const imageData = fs.readFileSync(imagePath);
        const imageBase64 = imageData.toString('base64');

        const prompt = `
            Analyze this receipt image and extract the following details in JSON format:
            - title: A short, descriptive title (e.g., "Starbucks", "Walmart"). If not clear, return null.
            - amount: The total amount as a number. If not clear, return null.
            - date: The date in YYYY-MM-DD format. If not clear, return null.
            
            Return ONLY the JSON object, no markdown formatting.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: req.file.mimetype
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean up the response text to ensure it's valid JSON
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);

        // Check if we got any useful data
        if (!data.title && !data.amount && !data.date) {
            throw new Error('No readable data found on receipt');
        }

        res.json(data);

    } catch (error) {
        console.error('Error scanning receipt:', error);

        let errorMessage = 'Failed to analyze receipt';
        if (error.message.includes('404')) {
            errorMessage = 'AI Service unavailable (Model not found)';
        } else if (error.message.includes('429')) {
            errorMessage = 'AI Service busy (Rate limit exceeded)';
        } else if (error instanceof SyntaxError) {
            errorMessage = 'Could not read receipt details';
        }

        res.status(500).json({ error: errorMessage });
    } finally {
        // Always delete the temporary file
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
};

module.exports = { scanReceipt };
