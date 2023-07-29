const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

const admin = require("firebase-admin");
const credentials = require("./ServiceAccountKey.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(credentials),
});

app.set('view engine', 'ejs');

// Middleware to parse JSON data and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static(__dirname + "/public"));

// ====================================================
// ============== Routes and Middleware ===============
// ====================================================

// Import and mount routers
const travelPlannerRouter = require('./routes/router');
const flightRouter = require('./routes/flightRoute');
const airbnbRouter = require('./routes/airbnbRoute');
const hotelRouter = require('./routes/hotelRoute');
const intineraryRouter = require('./routes/itinerary');

app.use('/', travelPlannerRouter);
app.use('/flight', flightRouter);
app.use('/airbnb', airbnbRouter);
app.use('/hotel', hotelRouter);
app.use('/itinerary', intineraryRouter);

app.listen(port, () => {
  console.log(`Now listening on port ${port}`);
});