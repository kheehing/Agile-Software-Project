const axios = require('axios');
const fs = require('fs');
const express = require('express');
const router = express.Router();
var baseURL = 'https://api1.diversesaga.com';
var searchAirportURL = '/api/v2/searchAirport';
var searchFlightsURL = '/api/v2/searchFlights';
var token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0YzkzYzdhN2I0ZTFmYjJkYjY1NzA3NCIsImlhdCI6MTY5MDkwOTgxOH0.2wQOpRQw5E2Bq_1guBBjXhcm93YlKJx7l9W6caTLsdE';

router.get('', (req, res) => {
  res.render('flight');
});

router.post('/oneWay', (req, res) => {
  const origin = req.body.origin;
  const destination = req.body.destination;
  const date = req.body.date;
  const adult = req.body.adult;
  const children = req.body.children;
  const infant = req.body.infant;
  const cabinClass = req.body.cabinClass;

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
      url: baseURL + searchAirportURL,
      params: { query: originIATA },
      headers: {
        'Authorization': token,
      }
    };

    const optionsForDestinationEntityId = {
      method: 'GET',
      url: baseURL + searchAirportURL,
      params: { query: destinationIATA },
      headers: {
        'Authorization': token,
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
          url: baseURL + searchFlightsURL,
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
            'Authorization': token,
          }
        };

        return axios.request(optionsForSearchFlights);
      }))
      .then(response => {
        console.log(response.data);
        res.status(200).json(response.data);
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
      url: baseURL + searchAirportURL,
      params: { query: originIATA },
      headers: {
        'Authorization': token,
      }
    };

    const optionsForDestinationEntityId = {
      method: 'GET',
      url: baseURL + searchAirportURL,
      params: { query: destinationIATA },
      headers: {
        'Authorization': token,
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
          url: baseURL + searchFlightsURL,
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
            'Authorization': token,
          }
        };

        return axios.request(optionsForSearchFlights);
      }))
      .then(response => {
        console.log(response.data);
        res.status(200).json(response.data);
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