const express = require('express');
const router = express.Router();
const axios = require('axios');

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

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
} 

router.get('', (req, res) => {
    res.render('airbnb', {user: req.session.user});
});

router.get('/searchResults', (req, res) => {
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
});

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
        console.log(propertyDetails.details[0].amenities[0].amenities);
        res.render('airbnbInfo', {user: req.session.user, tripDetails: tripDetails, propertyDetails: propertyDetails});
    });
});

//  =============================================================
//  ========== Redirect nonexistent MUST BE LAST ROUTE ==========
//  =============================================================

router.get("*", (req, res) => {
    res.status(404).render("404");
});

module.exports = router;