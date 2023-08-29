const express = require('express');
const router = express.Router();
const axios = require('axios');
const admin = require('firebase-admin');
const db = admin.firestore();

// Call airbnb API
async function getData(url, params) {
    const options = {
      method: 'GET',
      url: 'https://airbnb19.p.rapidapi.com/api/v1/' + url,
      params: params,
      headers: {
        'X-RapidAPI-Key': 'fffe0b8574msh8eae59e7166187fp1071ecjsn2f1e73046cab',
        'X-RapidAPI-Host': 'airbnb19.p.rapidapi.com'
      }
    }
    await delay(1000);
    return await axios.request(options);
}

// Wait 1 second between each request due to 1 request per second restriction
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
} 

// Airbnb page
router.get('', (req, res) => {
    res.render('airbnb', {user: req.session.user});
});

// Airbnb search results
router.get('/searchResults', (req, res) => {
    if (!req.query.destination && !req.query.adults && !req.query.children && !req.query.infants && !req.query.pets && !req.query.checkin && !req.query.checkout) {
        res.render('airbnbSearch', {user: req.session.user, searchInputs: {}, searchResults: []});
    }
    else {
        const inputs = {destination: req.query.destination, 
                        adults: req.query.adults, 
                        children: req.query.children, 
                        infants: req.query.infants,
                        pets: req.query.pets,
                        checkin: req.query.checkin, 
                        checkout: req.query.checkout};
        getData('searchDestination', {query: req.query.destination})
        .then(destinationResponse => {
            if (destinationResponse.data.data.length == 0) {
                res.render('airbnbSearch', {user: req.session.user, searchInputs: inputs, searchResults: []});
            }
            else {
                getData('searchPropertyByPlace', {id: destinationResponse.data.data[0].id, 
                                                currency: 'SGD', 
                                                adults: req.query.adults, 
                                                children: req.query.children, 
                                                infants: req.query.infants,
                                                pets: req.query.pets,
                                                checkin: req.query.checkin, 
                                                checkout: req.query.checkout})
                .then(propertiesResponse => {
                    const results = propertiesResponse.data.data;
                    console.log(results);
                    res.render('airbnbSearch', {user: req.session.user, searchInputs: inputs, searchResults: results});
                });
            }
        });
    }
});

// Airbnb information page
router.get('/:id', (req, res) => {
    const tripDetails = {propertyId: req.params.id,
                         currency: 'SGD',
                         checkIn: req.query.checkin, 
                         checkOut: req.query.checkout,
                         adults: req.query.adults, 
                         children: req.query.children, 
                         infants: req.query.infants,
                         pets: req.query.pets};
    getData('getPropertyDetails', tripDetails)
    .then(propertyResponse => {
        const propertyDetails = propertyResponse.data.data;
        console.log(propertyDetails);
        res.render('airbnbInfo', {user: req.session.user, tripDetails: tripDetails, propertyDetails: propertyDetails});
    });
});

// Book airbnb
router.post('/:id/book', async (req, res) => {
    try {
        await db.collection('airbnb').add({airbnbId: req.params.id,
                                           airbnbImage: req.body.airbnbImage,
                                           airbnbName: req.body.airbnbName,
                                           checkIn: req.body.checkin,
                                           checkOut: req.body.checkout,
                                           userId: req.session.user.uid})
        .then((docRef) => {
            res.status(201).json({bookingId: docRef.id});
        });
    } 
    catch (error) {
        res.status(500).json({error: 'An error occurred while booking the airbnb.'});
    }
});

//  =============================================================
//  ========== Redirect nonexistent MUST BE LAST ROUTE ==========
//  =============================================================

router.get("*", (req, res) => {
    res.status(404).render("404");
});

module.exports = router;