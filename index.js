const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
const session = require('express-session');
const admin = require('firebase-admin');
const credentials = require('./ServiceAccountKey.json');

// Body Parser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

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

const generateSecretKey = () => {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).slice(2);
  const secret = timestamp + randomString;
  return secret;
};

const secretKey = generateSecretKey();

app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// ====================================================
// ==================== Functions =====================
// ====================================================

function verifyFirebaseToken(req, res, next) {
  const idToken = req.headers.authorization;

  admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken;
      next();
    })
    .catch(error => {
      res.status(403).send('Unauthorized');
    });
}

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

app.use('/flight', verifyFirebaseToken, flightRouter);
app.use('/airbnb', verifyFirebaseToken, airbnbRouter);
app.use('/hotel', verifyFirebaseToken, hotelRouter);
app.use('/itinerary', verifyFirebaseToken, intineraryRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/home', verifyFirebaseToken, homeRouter);
app.use('/', travelPlannerRouter);

app.listen(port, () => {
  console.log(`Now listening on port ${port}`);
});