const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const Groq = require('groq-sdk');
const groqClient = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const pdfParse = require('pdf-parse');

const app = express();

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

const upload = multer({ dest: 'uploads/' });

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(express.json());

// This is a placeholder for a real AI API call.
// Replace this with a call to the Groq, Gemini, or another AI service.
async function generateSummaryWithAI(transcript, prompt) {
    if (groqClient) {
        try {
            const systemMessage = 'You are a helpful assistant that creates concise, structured summaries of meeting transcripts. Use clear headings and bullet points, include key decisions and action items. Honor the user instruction.';
            const userMessage = `Instruction: ${prompt || 'Summarize the meeting transcript with key points and action items.'}\n\nTranscript:\n${transcript}`;

            const completion = await groqClient.chat.completions.create({
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: userMessage }
                ],
                model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
                temperature: 0.3,
                max_tokens: Number(process.env.GROQ_MAX_TOKENS || 1024)
            });

            const content = completion.choices && completion.choices[0] && completion.choices[0].message && completion.choices[0].message.content
                ? completion.choices[0].message.content.trim()
                : '';

            if (content) {
                return content;
            }
        } catch (error) {
            console.error('Groq API error, falling back to simulated summary:', error);
        }
    }

    return new Promise(resolve => {
        setTimeout(() => {
            const summary = `--- AI-Generated Summary (Simulated) ---\n\nPrompt: "${prompt}"\n\nTranscript beginning:\n"${transcript.substring(0, 250)}..."\n\n[No GROQ_API_KEY configured. Set GROQ_API_KEY to enable real AI summaries.]`;
            resolve(summary);
        }, 800);
    });
}

// Endpoint to handle summary generation
app.post('/generate-summary', upload.single('transcript'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No transcript file uploaded.' });
    }

    const transcriptPath = req.file.path;
    const prompt = req.body.prompt;

    const cleanup = () => {
        fs.unlink(transcriptPath, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting temp transcript file:', unlinkErr);
        });
    };

    try {
        let transcriptText = '';
        const isPdf = (req.file.mimetype && req.file.mimetype === 'application/pdf') || req.file.originalname.toLowerCase().endsWith('.pdf');
        if (isPdf) {
            const dataBuffer = fs.readFileSync(transcriptPath);
            const parsed = await pdfParse(dataBuffer);
            transcriptText = parsed.text || '';
        } else {
            transcriptText = fs.readFileSync(transcriptPath, 'utf8');
        }
        cleanup();

        if (!transcriptText || transcriptText.trim().length === 0) {
            return res.status(400).json({ error: 'Uploaded file contains no extractable text.' });
        }

        const summary = await generateSummaryWithAI(transcriptText, prompt);
        res.json({ summary });
    } catch (err) {
        console.error('Summary generation error:', err);
        cleanup();
        res.status(500).json({ error: 'Failed to process transcript.' });
    }
});

// Endpoint to handle sharing the summary via email
app.post('/share-summary', async (req, res) => {
    const { summary, recipient } = req.body;

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpSecure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const emailFrom = process.env.EMAIL_FROM || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass) {
        return res.status(500).json({ message: 'Email service not configured on server.' });
    }

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
            user: smtpUser,
            pass: smtpPass
        }
    });

    const mailOptions = {
        from: emailFrom,
        to: recipient,
        subject: 'Your AI-Generated Meeting Summary',
        text: `Here is the meeting summary you requested:\n\n---\n\n${summary}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Email sending error:', error);
            return res.status(500).json({ message: 'Failed to send email. Check server logs for details.' });
        }
        console.log('Email sent successfully: ' + info.response);
        res.json({ message: `Email sent successfully to ${recipient}!` });
    });
});

app.get('/healthz', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});