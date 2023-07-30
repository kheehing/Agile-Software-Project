const axios = require('axios');
const fs = require('fs');
const express = require('express');
const router = express.Router();

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
      url: 'https://skyscanner50.p.rapidapi.com/api/v2/searchAirport',
      params: { query: originIATA },
      headers: {
        'X-RapidAPI-Key': '01ed34b342mshefc14e69833abd0p19335bjsnc209a23391d9',
        'X-RapidAPI-Host': 'skyscanner50.p.rapidapi.com'
      }
    };

    const optionsForDestinationEntityId = {
      method: 'GET',
      url: 'https://skyscanner50.p.rapidapi.com/api/v2/searchAirport',
      params: { query: destinationIATA },
      headers: {
        'X-RapidAPI-Key': '01ed34b342mshefc14e69833abd0p19335bjsnc209a23391d9',
        'X-RapidAPI-Host': 'skyscanner50.p.rapidapi.com'
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
          url: 'https://skyscanner50.p.rapidapi.com/api/v2/searchFlights',
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
            'X-RapidAPI-Key': '01ed34b342mshefc14e69833abd0p19335bjsnc209a23391d9',
            'X-RapidAPI-Host': 'skyscanner50.p.rapidapi.com'
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
      url: 'https://skyscanner50.p.rapidapi.com/api/v2/searchAirport',
      params: { query: originIATA },
      headers: {
        'X-RapidAPI-Key': '01ed34b342mshefc14e69833abd0p19335bjsnc209a23391d9',
        'X-RapidAPI-Host': 'skyscanner50.p.rapidapi.com'
      }
    };

    const optionsForDestinationEntityId = {
      method: 'GET',
      url: 'https://skyscanner50.p.rapidapi.com/api/v2/searchAirport',
      params: { query: destinationIATA },
      headers: {
        'X-RapidAPI-Key': '01ed34b342mshefc14e69833abd0p19335bjsnc209a23391d9',
        'X-RapidAPI-Host': 'skyscanner50.p.rapidapi.com'
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
          url: 'https://skyscanner50.p.rapidapi.com/api/v2/searchFlights',
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
            'X-RapidAPI-Key': '01ed34b342mshefc14e69833abd0p19335bjsnc209a23391d9',
            'X-RapidAPI-Host': 'skyscanner50.p.rapidapi.com'
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