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
app.use(express.json);
app.use(express.urlencoded({extended: true}));
app.use("/", travelPlannerRouter);



app.get('/', (req, res) => {
    res.render('', {root: __dirname});
});

app.listen(port, () => {
    console.log(`Now listening on port ${port}`); 
});