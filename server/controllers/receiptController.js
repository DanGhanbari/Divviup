const { VertexAI, HarmCategory, HarmBlockThreshold } = require('@google-cloud/vertexai');
const sharp = require('sharp');
const fs = require('fs');
require('dotenv').config();

const scanReceipt = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const projectId = process.env.GCP_PROJECT_ID;
        const location = process.env.GCP_LOCATION || 'us-central1';

        if (!projectId) {
            return res.status(500).json({ error: 'GCP_PROJECT_ID not configured' });
        }

        // Initialize Vertex AI
        console.log(`[VertexAI] Initializing with Project: ${projectId}, Location: ${location}`);
        const vertexAI = new VertexAI({ project: projectId, location: location });
        const model = vertexAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: 'object',
                    properties: {
                        title: { type: 'string' },
                        amount: { type: 'number' },
                        date: { type: 'string', description: 'YYYY-MM-DD' },
                        currency: { type: 'string' }
                    },
                    required: ['title', 'amount', 'date']
                }
            }
        });

        const imagePath = req.file.path;
        let inputBuffer = fs.readFileSync(imagePath);

        // Check for HEIC format (magic bytes or mimetype)
        const isHeic = req.file.mimetype === 'image/heic' ||
            req.file.mimetype === 'image/heif' ||
            req.file.originalname.toLowerCase().endsWith('.heic') ||
            req.file.originalname.toLowerCase().endsWith('.heif');

        if (isHeic) {
            console.log('Detected HEIC image. Converting to JPEG...');
            try {
                const heicConvert = require('heic-convert');
                inputBuffer = await heicConvert({
                    buffer: inputBuffer,
                    format: 'JPEG',
                    quality: 0.8
                });
                console.log('HEIC conversion successful.');
            } catch (heicError) {
                console.error('HEIC conversion failed:', heicError);
                throw new Error('Failed to convert iPhone photo. Please try a different image format.');
            }
        }

        // Optimize image (Resize to max 2048px)
        // Sharp can handle JPEG buffers (converted from HEIC) or file paths (for other formats)
        // passing buffer is safer if we just converted it
        const optimizedBuffer = await sharp(inputBuffer)
            .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
            .toFormat('jpeg', { quality: 80 })
            .toBuffer();

        const imageBase64 = optimizedBuffer.toString('base64');

        const request = {
            contents: [{
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            data: imageBase64,
                            mimeType: 'image/jpeg'
                        }
                    },
                    { text: 'Analyze this receipt. Extract the merchant name as "title", total amount as "amount", and transaction date as "date". Format date as YYYY-MM-DD. If year is missing, assume current year. Use context (like currency symbol, address) to determine if date is MM/DD (US) or DD/MM (International). Default to US format if currency is $ or ambiguous.' }
                ]
            }]
        };

        // Retry mechanism for Vertex AI calls
        const maxRetries = 3;
        let retryCount = 0;
        let finalError = null;
        let result = null;

        while (retryCount < maxRetries) {
            try {
                result = await model.generateContent(request);
                break; // Success, exit loop
            } catch (err) {
                const errString = err.toString();
                if (errString.includes('429') || errString.includes('RESOURCE_EXHAUSTED')) {
                    retryCount++;
                    console.warn(`[VertexAI] Rate limit hit. Retrying (${retryCount}/${maxRetries})...`);
                    if (retryCount === maxRetries) {
                        finalError = err;
                        break;
                    }
                    // Exponential backoff: 1s, 2s, 4s
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
                } else {
                    throw err; // Non-retriable error
                }
            }
        }

        if (finalError) throw finalError;

        const response = await result.response;

        // Vertex AI returns a structured JSON object directly in candidates[0].content.parts[0].text
        // But with responseMimeType: application/json, it's a string implementation of JSON
        const text = response.candidates[0].content.parts[0].text;
        const data = JSON.parse(text);

        // Check if we got any useful data
        if (!data.title && !data.amount && !data.date) {
            throw new Error('No readable data found on receipt');
        }

        console.log('Vertex AI Analysis:', data);
        res.json(data);

    } catch (error) {
        console.error('Error scanning receipt:', error);

        let errorMessage = 'Failed to analyze receipt. Please try again.';
        let statusCode = 500;

        // Extract detailed error message if available
        const errorDetails = error.message || error.toString();

        if (errorDetails.includes('400') || errorDetails.includes('INVALID_ARGUMENT')) {
            errorMessage = 'The image is invalid or cannot be processed. Please try a different photo.';
            statusCode = 400;
        } else if (errorDetails.includes('401') || errorDetails.includes('UNAUTHENTICATED')) {
            errorMessage = 'Server authentication failed. Please contact support.';
            statusCode = 401;
        } else if (errorDetails.includes('403') || errorDetails.includes('PERMISSION_DENIED')) {
            errorMessage = 'Permission denied. The server cannot access the AI model.';
            statusCode = 403;
        } else if (errorDetails.includes('404') || errorDetails.includes('NOT_FOUND')) {
            errorMessage = 'AI Model not available. Please contact support.';
            statusCode = 404;
        } else if (errorDetails.includes('429') || errorDetails.includes('RESOURCE_EXHAUSTED')) {
            errorMessage = 'We are experiencing high traffic. Please try again in a minute.';
            statusCode = 429;
        } else if (errorDetails.includes('500') || errorDetails.includes('INTERNAL')) {
            errorMessage = 'AI Service internal error. Please try again later.';
            statusCode = 503;
        } else if (errorDetails.includes('heif') || errorDetails.includes('compression format')) {
            errorMessage = 'HEIC/HEIF format not supported. Please convert to JPG.';
            statusCode = 415;
        } else if (errorDetails.includes('No readable data')) {
            errorMessage = 'Could not read receipt data. Please ensure the image is clear and contains a visible date and total.';
            statusCode = 422; // Unprocessable Entity
        }

        // Log structured error for observability
        console.error(`[ReceiptScanError] Status: ${statusCode}, Message: ${errorMessage}, Details: ${errorDetails}`);

        res.status(statusCode).json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        });
    } finally {
        // Always delete the temporary file
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
};

module.exports = { scanReceipt };
