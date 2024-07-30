
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the 'views' directory
app.use(express.static(path.join(__dirname, 'views')));

// Use payment routes defined in the paymentRoutes module
app.use('/', paymentRoutes);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
