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
  const adults = req.session.adults || 1;
  const children = req.session.children || 0;
  const infants = req.session.infants || 0;
  const cabinClass = req.session.cabinClass || 'economy';
  const flightData = req.session.flightData;
  const flightType = req.session.flightType;
  const formSubmitted = req.session.formSubmitted;

  const values = [
    req.session.flightType,
    req.session.originIATA,
    req.session.destinationIATA,
    req.session.dateInYYMMDD,
    req.session.dateFromInYYMMDD,
    req.session.dateToInYYMMDD,
    req.session.adults,
    req.session.cabinClass,
    req.session.children,
    req.session.infants
  ];

  const valuesJSON = JSON.stringify(values);
  console.log(values);


  res.render('flight', { origin, destination, date, from, to, adults, children, infants, cabinClass, flightData, formSubmitted, valuesJSON, flightType});
});

router.post('/oneWay', (req, res) => {
  const { origin, destination, date, adults, children, infants, cabinClass } = req.body;

  const parts = date.split('-')
  const yearLastTwoDigits = parts[0].slice(2);
  const month = parts[1];
  const day = parts[2];
  const dateInYYMMDD = `${yearLastTwoDigits}${month}${day}`;

  req.session.origin = origin;
  req.session.destination = destination;
  req.session.date = date;
  req.session.adults = adults;
  req.session.children = children;
  req.session.infants = infants;
  req.session.cabinClass = cabinClass;
  req.session.flightType = 'oneWay';
  req.session.dateInYYMMDD = dateInYYMMDD;


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
            adults: adults,
            childrens: children,
            infants: infants,
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
  const { origin, destination, from: dateFrom, to: dateTo, adults, children, infants, cabinClass } = req.body;

  const parts = dateFrom.split('-')
  const yearLastTwoDigits = parts[0].slice(2);
  const month = parts[1];
  const day = parts[2];
  const dateFromInYYMMDD = `${yearLastTwoDigits}${month}${day}`;

  const parts1 = dateTo.split('-')
  const parts1YY = parts1[0].slice(2);
  const parts1MM = parts1[1];
  const parts1DD = parts1[2];
  const dateToInYYMMDD = `${parts1YY}${parts1MM}${parts1DD}`;

  req.session.origin = origin;
  req.session.destination = destination;
  req.session.from = dateFrom;
  req.session.to = dateTo;
  req.session.adults = adults;
  req.session.children = children;
  req.session.infants = infants;
  req.session.cabinClass = cabinClass;
  req.session.flightType = "roundTrip";
  req.session.dateFromInYYMMDD = dateFromInYYMMDD;
  req.session.dateToInYYMMDD = dateToInYYMMDD;

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
            date: dateFrom,
            returnDate: dateTo,
            adults: adults,
            childrens: children,
            infants: infants,
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