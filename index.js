const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
const admin = require('./firebaseAdmin.js');

const dotenv = require('dotenv');
dotenv.config();

const session = require('express-session');
const crypto = require('crypto');

const generateSecretKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

app.use(session({
  secret: generateSecretKey(), // Replace with the generated secret key
  resave: false,
  saveUninitialized: true
}));

// Body Parser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

// Middleware to parse JSON data and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static(__dirname + "/public"));

// ====================================================
// ==================== Functions =====================
// ====================================================

// async function checkAuth(req, res, next) {
//   const idToken = req.headers.authorization;

//   if (!idToken) {
//     return res.status(401).send('Unauthorized');
//   }

//   try {
//     const decodedToken = await admin.auth().verifyIdToken(idToken);
//     req.uid = decodedToken.uid; // Store the user's UID in the request object
//     next(); // Continue to the next middleware or route handler
//   } catch (error) {
//     console.error('Error verifying ID token:', error);
//     res.status(401).send('Unauthorized');
//   }
// }

// ====================================================
// ============== Routes and Middleware ===============
// ====================================================

// Import and mount routers
const travelPlannerRouter = require('./routes/router');
const flightRouter = require('./routes/flightRoute');
const airbnbRouter = require('./routes/airbnbRoute');
const hotelRouter = require('./routes/hotelRoute');
const intineraryRouter = require('./routes/itineraryRoute');
const loginRouter = require('./routes/loginRoute');
const registerRouter = require('./routes/registerRoute');
const homeRouter = require('./routes/homeRoute');

app.use('/flight', flightRouter);
app.use('/airbnb', airbnbRouter);
app.use('/hotel', hotelRouter);
app.use('/itinerary', intineraryRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/home', homeRouter);
app.use('/', travelPlannerRouter);

app.listen(port, () => {
  console.log(`Now listening on port ${port}`);
});