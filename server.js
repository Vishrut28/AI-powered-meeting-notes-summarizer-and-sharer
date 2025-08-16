const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

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
    console.log("Generating summary with AI...");
    // Simulate an API call with a delay
    return new Promise(resolve => {
        setTimeout(() => {
            const summary = `--- AI-Generated Summary ---\n\nPrompt: "${prompt}"\n\nTranscript beginning:\n"${transcript.substring(0, 250)}..."\n\n[This is a simulated summary. Integrate a real AI API to get a meaningful result.]`;
            resolve(summary);
        }, 1500);
    });
}

// Endpoint to handle summary generation
app.post('/generate-summary', upload.single('transcript'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No transcript file uploaded.' });
    }

    const transcriptPath = req.file.path;
    const prompt = req.body.prompt;

    fs.readFile(transcriptPath, 'utf8', async (err, transcript) => {
        // Clean up the uploaded file immediately after reading
        fs.unlink(transcriptPath, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting temp transcript file:', unlinkErr);
        });

        if (err) {
            console.error('File read error:', err);
            return res.status(500).json({ error: 'Failed to read transcript file.' });
        }

        try {
            const summary = await generateSummaryWithAI(transcript, prompt);
            res.json({ summary });
        } catch (aiError) {
            console.error('AI service error:', aiError);
            res.status(500).json({ error: 'Failed to generate summary from AI service.' });
        }
    });
});

// Endpoint to handle sharing the summary via email
app.post('/share-summary', async (req, res) => {
    const { summary, recipient } = req.body;

    // IMPORTANT: Replace with your actual email service credentials.
    // Using a service like SendGrid or Mailgun is recommended for production.
    // For Gmail, you'll need to set up an "App Password".
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'vvvishrutvv2004@gmail.com', // Replace with your Gmail address
            pass: 'vishrut028'    // Replace with your Gmail App Password
        }
    });

    const mailOptions = {
        from: '"Meeting Summarizer" <your-email@gmail.com>', // Replace with your email
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});