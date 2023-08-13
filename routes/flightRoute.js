const axios = require('axios');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const router = express.Router();


router.get('', (req, res) => {
  const origin = req.session.origin || '';
  const destination = req.session.destination || '';
  const date = req.session.date || '';
  const to = req.session.to || '';
  const from = req.session.from || '';
  const adult = req.session.adult || 1;
  const children = req.session.children || 0;
  const infant = req.session.infant || 0;
  const cabinClass = req.session.cabinClass || 'economy';
  const flightData = req.session.flightData;
  const flightType = req.session.flightType;
  const formSubmitted = req.session.formSubmitted;

  res.render('flight', { origin, destination, date, from, to, adult, children, infant, cabinClass, flightData, flightType, formSubmitted});
});

router.post('/oneWay', (req, res) => {
  const origin = req.body.origin;
  const destination = req.body.destination;
  const date = req.body.date;
  const adult = req.body.adult;
  const children = req.body.children;
  const infant = req.body.infant;
  const cabinClass = req.body.cabinClass;

  req.session.origin = origin;
  req.session.destination = destination;
  req.session.date = date;
  req.session.adult = adult;
  req.session.children = children;
  req.session.infant = infant;
  req.session.cabinClass = cabinClass;
  req.session.flightType = 'oneWay';


  fs.readFile('./public/data/airports.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('An error occurred reading the JSON file');
    }

    const airports = JSON.parse(data);

    // Search for the origin airport and get its IATA code
    const originAirport = airports.find(airport => airport.Combine === origin);
    const destinationAirport = airports.find(airport => airport.Combine === destination);

    const originIATA = originAirport.IATA;
    const destinationIATA = destinationAirport.IATA;
    req.session.originIATA = originIATA;
    req.session.destinationIATA = destinationIATA;

    const optionsForOriginEntityId = {
      method: 'GET',
      url: process.env.AirportURL,
      params: { query: originIATA },
      headers: {
        'Authorization': process.env.flightToken
      }
    };

    const optionsForDestinationEntityId = {
      method: 'GET',
      url: process.env.AirportURL,
      params: { query: destinationIATA },
      headers: {
        'Authorization': process.env.flightToken
      }
    };

    axios.all([
      axios.request(optionsForOriginEntityId),
      axios.request(optionsForDestinationEntityId)
    ])
      .then(axios.spread((originResponse, destinationResponse) => {
        const originEntityId = originResponse.data.data[0].navigation.entityId;
        const destinationEntityId = destinationResponse.data.data[0].navigation.entityId;

        const optionsForSearchFlights = {
          method: 'GET',
          url: process.env.FlightsURL,
          params: {
            originSkyId: originIATA,
            destinationSkyId: destinationIATA,
            originEntityId: originEntityId,
            destinationEntityId: destinationEntityId,
            date: date,
            adults: adult,
            childrens: children,
            infants: infant,
            cabinClass: cabinClass,
            currency: 'USD'
          },
          headers: {
            'Authorization': process.env.flightToken
          }
        };

        const remainingQuota = destinationResponse.headers['remainingquota'];
        console.log('Remaining Quota:', remainingQuota);
        return axios.request(optionsForSearchFlights);
      }))
      .then(response => {
        // res.status(200).json(response.data);
        req.session.flightData = response.data;
        req.session.formSubmitted = 'true';
        res.redirect('/flight');
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('An error occurred making the request');
      });

  });
});

router.post('/roundTrip', (req, res) => {
  const origin = req.body.origin;
  const destination = req.body.destination;
  const dateFrom = req.body.from;
  const dateTo = req.body.to;
  const adult = req.body.adult;
  const children = req.body.children;
  const infant = req.body.infant;
  const cabinClass = req.body.cabinClass;

  req.session.origin = origin;
  req.session.destination = destination;
  req.session.from = dateFrom;
  req.session.to = dateTo;
  req.session.adult = adult;
  req.session.children = children;
  req.session.infant = infant;
  req.session.cabinClass = cabinClass;
  req.session.flightType = "roundTrip";

  fs.readFile('./public/data/airports.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('An error occurred reading the JSON file');
    }

    const airports = JSON.parse(data);

    // Search for the origin airport and get its IATA code
    const originAirport = airports.find(airport => airport.Combine === origin);
    const destinationAirport = airports.find(airport => airport.Combine === destination);

    const originIATA = originAirport.IATA;
    const destinationIATA = destinationAirport.IATA;

    const optionsForOriginEntityId = {
      method: 'GET',
      url: process.env.AirportURL,
      params: { query: originIATA },
      headers: {
        'Authorization': process.env.flightToken
      }
    };

    const optionsForDestinationEntityId = {
      method: 'GET',
      url: process.env.AirportURL,
      params: { query: destinationIATA },
      headers: {
        'Authorization': process.env.flightToken
      }
    };

    axios.all([
      axios.request(optionsForOriginEntityId),
      axios.request(optionsForDestinationEntityId)
    ])
      .then(axios.spread((originResponse, destinationResponse) => {
        const originEntityId = originResponse.data.data[0].navigation.entityId;
        const destinationEntityId = destinationResponse.data.data[0].navigation.entityId;

        const optionsForSearchFlights = {
          method: 'GET',
          url: process.env.FlightsURL,
          params: {
            originSkyId: originIATA,
            destinationSkyId: destinationIATA,
            originEntityId: originEntityId,
            destinationEntityId: destinationEntityId,
            date: dateFrom,
            returnDate: dateTo,
            adults: adult,
            childrens: children,
            infants: infant,
            cabinClass: cabinClass,
            currency: 'USD'
          },
          headers: {
            'Authorization': process.env.flightToken
          }
        };

        const remainingQuota = destinationResponse.headers['remainingquota'];
        console.log('Remaining Quota:', remainingQuota);
        return axios.request(optionsForSearchFlights);
      }))
      .then(response => {
        // res.status(200).json(response.data);
        req.session.flightData = response.data;
        req.session.formSubmitted = 'true';
        res.redirect('/flight');
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('An error occurred making the request');
      });

  });
});

router.post('/multiStop', (req,res) => {
  console.log(req.body);
});






//  =============================================================
//  ========== Redirect nonexistent MUST BE LAST ROUTE ==========
//  =============================================================

router.get("*", (req, res) => {
  res.status(404).render("404");
});

module.exports = router;