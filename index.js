const express = require('express');
const dotenv = require('dotenv');

const app = express();

dotenv.config();

app.get('/endpoint-1', () => {
    res.status(200).json({
        success: true,
        data: {
            message: 'Hello world 1'
        }
    })
});

app.get('/endpoint-2', () => {
    res.status(200).json({
        success: true,
        data: {
            message: 'Hello world 2'
        }
    })
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, ()=> console.log(`server is running on port ${PORT}`));