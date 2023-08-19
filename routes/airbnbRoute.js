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
    res.render('airbnb', {searchInputs: {adults: 1, children: 0, infants: 0}, searchResults: []});
});

router.post('/searchResults', (req, res) => {
    const inputs = {destination: req.body.destination, 
                    adults: req.body.adults, 
                    children: req.body.children, 
                    infants: req.body.infants, 
                    checkin: req.body.checkin, 
                    checkout: req.body.checkout};
    getData('searchDestination', {query: req.body.destination})
    .then(destinationResponse => {
        getData('searchPropertyByPlace', {id: destinationResponse.data.data[0].id, 
                                          currency: 'SGD', 
                                          adults: req.body.adults, 
                                          children: req.body.children, 
                                          infants: req.body.infants, 
                                          checkin: req.body.checkin, 
                                          checkout: req.body.checkout})
        .then(propertiesResponse => {
            const results = propertiesResponse.data.data;
            console.log(results);
            res.render('airbnb', {searchInputs: inputs, searchResults: results});
        });
    });
});

router.post('/:id', (req, res) => {
    const tripDetails = {propertyId: req.params.id,
                         currency: 'SGD',
                         checkIn: req.body.checkin, 
                         checkOut: req.body.checkout,
                         adults: req.body.adults, 
                         children: req.body.children, 
                         infants: req.body.infants};
    getData('getPropertyDetails', tripDetails)
    .then(propertyResponse => {
        const propertyDetails = propertyResponse.data.data;
        console.log(propertyDetails);
        res.render('airbnbDetails', {tripDetails: tripDetails, propertyDetails: propertyDetails});
    });
});










//  =============================================================
//  ========== Redirect nonexistent MUST BE LAST ROUTE ==========
//  =============================================================

router.get("*", (req, res) => {
    res.status(404).render("404");
});

module.exports = router;