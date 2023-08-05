const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
const session = require('express-session');
const admin = require('./firebaseAdmin.js');

// Body Parser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

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

function checkAuth(req, res, next) {
  // const idToken = req.headers.authorization;

  // admin.auth().verifyIdToken(idToken).then((decodedToken) => {
  //   const uid = decodedToken.uid;
  //   req.uid = uid;
  //   next();
  // }).catch((error) => {
  //   res.status(401).send('Unauthorized');
  // });
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

app.use('/flight', checkAuth, flightRouter);
app.use('/airbnb', checkAuth, airbnbRouter);
app.use('/hotel', checkAuth, hotelRouter);
app.use('/itinerary', checkAuth, intineraryRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/home', checkAuth, homeRouter);
app.use('/', travelPlannerRouter);

app.listen(port, () => {
  console.log(`Now listening on port ${port}`);
});