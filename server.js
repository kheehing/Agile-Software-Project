const express = require('express');
const app = express();
const port = process.env.port || 8080;

const admin = require("firebase-admin");
const credentials = require("./ServiceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(credentials)
});

const db = admin.firestore();
app.use(express.json);
app.use(express.urlencoded({extended: true}));

//Idiomatic expression in express to route and respond to a client request
app.get('/', (req, res) => {        //get requests to the root ("/") will route here
    res.sendFile('index.html', {root: __dirname});      //server responds by sending the index.html file to the client's browser
                                                        //the .sendFile method needs the absolute path to the file, see: https://expressjs.com/en/4x/api.html#res.sendFile 
});

app.listen(port, () => {            //server starts listening for any attempts from a client to connect at port: {port}
    console.log(`Now listening on port ${port}`); 
});