const axios = require('axios');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Render /flight
router.get('', (req, res) => {
  res.render('flight', {user: req.session.user});
});

// Renders /flight/flightDetails
router.get('/flightDetails', (req, res) => {
  const flightData = req.session.flightData;
  const OriginAirportName = req.session.OriginAirportName;
  const DestinationAirportName = req.session.DestinationAirportName;
  const error = req.session.error;
  
  // Storing the values chosen in an array which is used to redirect
  // to skyscanner's booking site
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

  res.render('flightDetails', {flightData, valuesJSON, OriginAirportName, DestinationAirportName, user: req.session.user, error});
});

// Getting the form values for one way trips
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


  // Opens the airports.json file within public/data
  fs.readFile('./public/data/airports.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('An error occurred reading the JSON file');
    }

    const airports = JSON.parse(data);

    // Search for the origin airport and get its IATA code
    const originAirport = airports.find(airport => airport.Combine === origin);
    const destinationAirport = airports.find(airport => airport.Combine === destination);

    // Getting the values and passing it into the session variables
    const originIATA = originAirport.IATA;
    const destinationIATA = destinationAirport.IATA;
    req.session.originIATA = originIATA;
    req.session.destinationIATA = destinationIATA;
    const OriginAirportName = originAirport.Name;
    const DestinationAirportName = destinationAirport.Name;
    req.session.OriginAirportName = OriginAirportName;
    req.session.DestinationAirportName = DestinationAirportName;

    // Using the airport search to get skyscanner's custom entityId for both origin and destination
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
        // selects the entityId to be passed to the searchFlights API
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
        // Redirects to the flightDetails page with the result from the API
        // res.status(200).json(response.data);
        req.session.flightData = response.data;
        req.session.error = 'false';
        res.redirect('/flight/flightDetails');
      })
      .catch(error => {
        // Catch any error and print an error message in flightDetails page
        console.error(error);
        req.session.error = 'true';
        res.redirect('/flight/flightDetails');
      });

  });
});

// gets the value from the round trip form
router.post('/roundTrip', (req, res) => {
  const { origin, destination, from: dateFrom, to: dateTo, adults, children, infants, cabinClass } = req.body;

  // Converts the Date from the form to a YYMMDD format
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

  // Passing the variables to a session variables
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

  // opening the airports.json file to find the IATA for the airports chosen
  fs.readFile('./public/data/airports.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('An error occurred reading the JSON file');
    }

    const airports = JSON.parse(data);

    // Search for the origin airport and get its IATA code
    const originAirport = airports.find(airport => airport.Combine === origin);
    const destinationAirport = airports.find(airport => airport.Combine === destination);
    
    // Passing the values to a session variable
    const originIATA = originAirport.IATA;
    const destinationIATA = destinationAirport.IATA;
    req.session.originIATA = originIATA;
    req.session.destinationIATA = destinationIATA;
    const OriginAirportName = originAirport.Name;
    const DestinationAirportName = destinationAirport.Name;
    req.session.OriginAirportName = OriginAirportName;
    req.session.DestinationAirportName = DestinationAirportName;

    // Sets the params for SearchAirport in the api
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
        // Gets the entityId for the airports to be used in searchFlights
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
        // redirect to flightdetails page with the data collected
        // res.status(200).json(response.data);
        req.session.error = 'false';
        req.session.flightData = response.data;
        res.redirect('/flight/flightDetails');
      })
      .catch(error => {
        // catch any error and print the error in flight details page
        console.error(error);
        // res.redirect('/flight');
        req.session.error = 'true';
        res.redirect('/flight/flightDetails');
      });
  });
});

// gets the data from the button to add to itinerary
router.post("/addToDatabase", (req, res) => {
  const data = req.body;
  // Depending on the number of legs it can be determined whether it is a oneway trip or round trip
  if (data.legs.length == 1) {
    const onewayData = {
      userid: req.session.user.uid,
      price: "USD " + data.price.formatted,
      origin: data.legs[0].origin.name,
      destination: data.legs[0].destination.name,
      duration: data.legs[0].durationInMinutes,
      departure: data.legs[0].departure,
      arrival: data.legs[0].arrival,
      stop: data.legs[0].stopCount,
      carrierName: data.legs[0].carriers.marketing[0].name,
      carrierLogo: data.legs[0].carriers.marketing[0].logoUrl,
      tripType: "one-way"
    }
    const onewayRef = db.collection("flights");
    onewayRef.add(onewayData)
      .then(docRef => {
        // console.log("Document written with ID: ", docRef.id);
        res.json({ success: true, message: "Data added to Firestore", bookingId: docRef.id });
      })
      .catch(error => {
        console.error("Error adding document: ", error);
        res.json({ success: false, error: "Error adding document" });
      });
    // console.log(onewayData);
  } 
  else {
    const roundTripData = {
      userid: req.session.user.uid,
      price: "USD " + data.price.formatted,
      origin1: data.legs[0].origin.name,
      destination1: data.legs[0].destination.name,
      duration1:data.legs[0].durationInMinutes,
      departure1: data.legs[0].departure,
      arrival1: data.legs[0].arrival,
      stop1: data.legs[0].stopCount,
      carrierName: data.legs[0].carriers.marketing[0].name,
      carrierLogo: data.legs[0].carriers.marketing[0].logoUrl,
      origin2: data.legs[1].origin.name,
      destination2: data.legs[1].destination.name,
      duration2:data.legs[1].durationInMinutes,
      departure2: data.legs[1].departure,
      arrival2: data.legs[1].arrival,
      stop2: data.legs[1].stopCount,
      tripType: "round-trip"
    }
    const roundTripRef = db.collection("flights");
    roundTripRef.add(roundTripData)
      .then(docRef => {
        // console.log("Document written with ID: ", docRef.id);
        res.json({ success: true, message: "Data added to Firestore", bookingId: docRef.id });
      })
      .catch(error => {
        console.error("Error adding document: ", error);
        res.json({ success: false, error: "Error adding document" });
      });
    // console.log(roundTripData);
  }
});

//  =============================================================
//  ========== Redirect nonexistent MUST BE LAST ROUTE ==========
//  =============================================================

router.get("*", (req, res) => {
  res.status(404).render("404");
});

module.exports = router;