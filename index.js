const express = require('express');
const app = express();
const port = process.env.port || 8080;
const travelPlannerRouter = require("./routes/router");
const admin = require("firebase-admin");
const credentials = require("./ServiceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(credentials)
});

// ====================================================
// ==================== App Config ====================
// ====================================================

const db = admin.firestore();
app.use(express.json());
app.use(express.static(__dirname + "/public")); // this line need to be before -> app.use("", travelPlannerRouter);
app.use("", travelPlannerRouter);
app.use(express.urlencoded({extended: true}));

app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.listen(port, () => {
    console.log(`Now listening on port ${port}`); 
});