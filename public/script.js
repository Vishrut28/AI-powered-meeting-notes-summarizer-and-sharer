document.getElementById('generate-summary').addEventListener('click', async () => {
    const transcriptFile = document.getElementById('transcript').files[0];
    const prompt = document.getElementById('prompt').value;

    if (!transcriptFile) {
        alert('Please upload a transcript file.');
        return;
    }

    const formData = new FormData();
    formData.append('transcript', transcriptFile);
    formData.append('prompt', prompt);

    try {
        const response = await fetch('/generate-summary', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        document.getElementById('summary').innerText = data.summary;
    } catch (error) {
        console.error('Error generating summary:', error);
        alert('Failed to generate summary.');
    }
});

document.getElementById('share-email').addEventListener('click', async () => {
    const summary = document.getElementById('summary').innerText;
    const recipient = document.getElementById('recipient').value;

    if (!summary) {
        alert('Please generate a summary first.');
        return;
    }

    if (!recipient) {
        alert('Please enter a recipient email address.');
        return;
    }

    try {
        const response = await fetch('/share-summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ summary, recipient }),
        });

        const data = await response.json();
        alert(data.message);
    } catch (error) {
        console.error('Error sharing summary:', error);
        alert('Failed to share summary.');
    }
});