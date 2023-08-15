const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
const admin = require('./firebaseAdmin.js');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();



// Cookie Parser
app.use(cookieParser());

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

async function requireLogin(req, res, next) {
  const idToken = req.headers.authorization || req.cookies.idToken;

  if (!idToken) {
    console.log('No ID token found. Redirecting to login.');
    return res.redirect('/');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.uid = decodedToken.uid;
    next();
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Token expired, please refresh the token' });
    }
    console.error('Error verifying ID token:', error);
    res.redirect('/');
  }
}

app.get('/verifyToken', requireLogin, (req, res) => {
  res.status(200).send({ valid: true });
});

// ====================================================
// ============== Routes and Middleware ===============
// ====================================================

// Applying middleware
app.use('/flight', requireLogin);
app.use('/airbnb', requireLogin);
app.use('/hotel', requireLogin);
app.use('/itinerary', requireLogin);
app.use('/home', requireLogin);

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