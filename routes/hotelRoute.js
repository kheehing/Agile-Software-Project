const express = require('express');
const router = express.Router();
const axios = require('axios');
const admin = require('firebase-admin');
const db = admin.firestore();

const MAX_REQUESTS_PER_SECOND = 5;
let requestsThisSecond = 0;
const requestQueue = [];

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function handleRateLimit() {
  if (requestsThisSecond < MAX_REQUESTS_PER_SECOND) {
    requestsThisSecond++;
    return true;
  } else {
    await delay(1000); // Delay for 1 second
    requestsThisSecond = 0;
    return true;
  }
}

async function makeApiRequestWithRateLimit(options, initialDelayMs) {
  let retries = 0;
  let delayMs = initialDelayMs;

  while (true) {
    try {
      const isRateLimited = await handleRateLimit();
      if (!isRateLimited) {
        throw new Error("Rate limit exceeded.");
      }

      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 429) {
        // If 429 status code, retry with exponential backoff
        retries++;
        console.warn(`Rate limit exceeded. Retrying in ${delayMs}ms (Retry ${retries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        // Increase the delay exponentially
        delayMs *= 2;
      } else {
        // If it's not a rate-limiting issue, reject immediately
        throw error;
      }
    }
  }
}

// Call hotel API
async function getHotelData(url, params) {
  const options = {
    method: 'GET',
    url: 'https://booking-com.p.rapidapi.com/v1/hotels/search' + url,
    params: params,
    headers: {
      'X-RapidAPI-Key': 'e15a5fc2d8msh9914d1f214b4e02p1ea8b4jsndf09beae5d59',
        'X-RapidAPI-Host': 'booking-com.p.rapidapi.com',
    }
  };

  await delay(3000);
  return await axios.request(options);
}


router.get('', async (req, res) => {
  try {
    // Fetch hotel data using the Booking.com API
    const options = {
      method: 'GET',
      url: 'https://booking-com.p.rapidapi.com/v1/hotels/search',
      params: {
        checkin_date: '2023-09-27',
        dest_type: 'hotel',
        units: 'metric',
        checkout_date: '2023-09-29',
        adults_number: '2',
        order_by: 'popularity',
        dest_id: '25054',
        filter_by_currency: 'SGD',
        locale: 'en-gb',
        room_number: '1',
        children_number: '2',
        children_ages: '5,0',
        categories_filter_ids: 'class::2,class::4,free_cancellation::1',
        page_number: '0',
        include_adjacency: 'true'
      },
      headers: {
        'X-RapidAPI-Key': 'e15a5fc2d8msh9914d1f214b4e02p1ea8b4jsndf09beae5d59',
        'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
      }
    };

    const response = await axios.request(options);
    const hotelResults = response.data.result || [];

    // Extract max_photo_url from the first 3 results
    const images = hotelResults.slice(0, 3).map(result => result.max_photo_url);

    // Render the hotel page and pass the images to the EJS template
    res.render('hotel', {
      images,
      user: req.session.user
    });
  } catch (error) {
    console.error(error);
    router.get("*", (req, res) => {
      res.status(404).render("404");
    });
  }
});

router.get('/search', async (req, res) => {
  const searchLocation = req.query.location;
  const checkinDate = req.query.checkin;
  const checkoutDate = req.query.checkout;
  const adultsNumber = req.query.pax;

  const options = {
    method: 'GET',
    url: 'https://booking-com.p.rapidapi.com/v1/hotels/locations',
    params: {
      name: searchLocation,
      checkin_date: checkinDate,
      checkout_date: checkoutDate,
      adults_number: adultsNumber,
      locale: 'en-gb'
    },
    headers: {
      'X-RapidAPI-Key': 'e15a5fc2d8msh9914d1f214b4e02p1ea8b4jsndf09beae5d59',
      'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    const hotels = response.data.filter(item => item.dest_type === 'hotel');
    const destIds = hotels.map(hotel => hotel.dest_id);
    console.log("destination id: " + destIds);

    const hotelPromises = destIds.map(async (destId, index) => {
      const hotelOptions = {
        method: 'GET',
        url: 'https://booking-com.p.rapidapi.com/v1/hotels/search',
        params: {
          checkin_date: checkinDate,
          dest_type: 'hotel',
          units: 'metric',
          checkout_date: checkoutDate,
          adults_number: adultsNumber,
          order_by: 'popularity',
          dest_id: destId,
          filter_by_currency: 'SGD',
          locale: 'en-gb',
          room_number: '1',
          children_number: '2',
          children_ages: '5,0',
          categories_filter_ids: 'class::2,class::4,free_cancellation::1',
          page_number: '0',
          include_adjacency: 'true'
        },
        headers: {
          'X-RapidAPI-Key': 'e15a5fc2d8msh9914d1f214b4e02p1ea8b4jsndf09beae5d59',
          'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
        }
      };
      const response = await axios.request(hotelOptions);
      const results = response.data.result || [];

      const hotelNames = [];
      for (const hotelData of results) {
        const hotelName = hotelData.hotel_name;
        hotelNames.push(hotelName);
      }
      // console.log("Results:", JSON.stringify(response.data.result[0], null, 2));

      return results.map(hotelData => ({
        max_photo_url: hotelData.max_photo_url,
        hotel_name: hotelData.hotel_name,
        hotel_address: hotelData.address,
        hotel_id: hotelData.hotel_id,
        hotel_city: hotelData.city,
        review_score: hotelData.review_score,
        review_score_word: hotelData.review_score_word,
        price_currency: hotelData.composite_price_breakdown.gross_amount_per_night.currency,
        price_per_night: hotelData.composite_price_breakdown.gross_amount_per_night.value.toFixed(2)
      }));

      return {
        hotelNames: hotelsData.map(hotel => hotel.hotel_name),
        hotelsData
      };
    });

    const hotelLists = await Promise.all(hotelPromises);
    //console.log("Hotel Lists:", JSON.stringify(hotelLists, null, 2));

    // Flatten the array of arrays to a single array
    const flattendHotels = hotelLists.reduce((acc, curr) => acc.concat(curr), []);

    res.render('hotelSearch', {
      location: searchLocation,
      hotels: flattendHotels,
      checkinDate: checkinDate,
      checkoutDate: checkoutDate,
      adultsNumber: adultsNumber,
      user: req.session.user
    });
  } catch (error) {
    console.error(error);
    res.status(404).render("404");
  }
});


// Add the route for getting autocomplete suggestions
router.get('/get-suggestions', async (req, res) => {
  const query = req.query.query;
  //console.log("The query is: " + query);

  const options = {
    method: 'GET',
    url: 'https://booking-com.p.rapidapi.com/v1/hotels/locations',
    params: {
      name: query,
      locale: 'en-gb'
    },
    headers: {
      'X-RapidAPI-Key': 'e15a5fc2d8msh9914d1f214b4e02p1ea8b4jsndf09beae5d59',
      'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    const suggestions = response.data;
    res.json(suggestions);
  } catch (error) {
    console.error(error);
    router.get("*", (req, res) => {
      res.status(404).render("404");
    });
  }
});

router.get('/information', async (req, res) => {
  const hotelId = req.query.hotel_id;
  const checkinDate = req.query.checkin;
  const checkoutDate = req.query.checkout;
  const pax = req.query.pax;

  try {

    // Fetch hotel images using the Booking.com API based on hotelId
    const imageOptions = {
      method: 'GET',
      url: 'https://booking-com.p.rapidapi.com/v1/hotels/photos',
      params: {
        hotel_id: hotelId,
        locale: 'en-gb'
      },
      headers: {
        'X-RapidAPI-Key': 'e15a5fc2d8msh9914d1f214b4e02p1ea8b4jsndf09beae5d59',
        'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
      }
    };

    // Fetch hotel data using the Booking.com API based on hotelId
    const hotelDataOptions = {
      method: 'GET',
      url: 'https://booking-com.p.rapidapi.com/v1/hotels/data',
      params: {
        hotel_id: hotelId,
        locale: 'en-gb'
      },
      headers: {
        'X-RapidAPI-Key': 'e15a5fc2d8msh9914d1f214b4e02p1ea8b4jsndf09beae5d59',
        'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
      }
    };

    // Fetch hotel reviews using the Booking.com API based on hotelId
    const reviewOptions = {
      method: 'GET',
      url: 'https://booking-com.p.rapidapi.com/v1/hotels/reviews',
      params: {
        sort_type: 'SORT_MOST_RELEVANT',
        hotel_id: hotelId,
        locale: 'en-gb',
        language_filter: 'en-gb,de,fr',
        customer_type: 'solo_traveller,review_category_group_of_friends'
      },
      headers: {
        'X-RapidAPI-Key': 'e15a5fc2d8msh9914d1f214b4e02p1ea8b4jsndf09beae5d59',
        'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
      }
    };

    const roomOptions = {
      method: 'GET',
      url: 'https://booking-com.p.rapidapi.com/v1/hotels/room-list',
      params: {
        hotel_id: hotelId,
        currency: 'SGD',
        checkout_date: checkoutDate,
        locale: 'en-gb',
        checkin_date: checkinDate,
        adults_number_by_rooms: pax,
        units: 'metric',
      },
      headers: {
        'X-RapidAPI-Key': 'e15a5fc2d8msh9914d1f214b4e02p1ea8b4jsndf09beae5d59',
        'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
      }
    };

    // Fetch all necessary data concurrently
    const [imageResponse, hotelDataResponse, reviewResponse] = await Promise.all([
      axios.request(imageOptions),
      axios.request(hotelDataOptions),
      axios.request(reviewOptions),
    ]);

    const roomResponse = await makeApiRequestWithRateLimit(roomOptions, 3000);

    console.log("hotel id: " + hotelId);

    const hotelImages = imageResponse.data;

    // Collect the top 7 url_max images
    const topImages = hotelImages
      .slice(1, 8)
      .map(item => (item.url_1440) || '');


    const hotelReviews = reviewResponse.data.result;
    const hotelTopReviews = hotelReviews
      .slice(1, 8);

    const hotelData = hotelDataResponse.data;

    const roomData = roomResponse;

    //console.log("room data:", roomData);

    //console.log("hotel data:", hotelData);


    // Render the hotel information page and pass the retrieved data to the EJS template
    res.render('hotelInfo', {
      hotelData: hotelData,
      hotelImages: topImages,
      hotelReviews: hotelTopReviews,
      hotelId: hotelId,
      roomData: roomData,
      user: req.session.user
    });
  } catch (error) {
    const roomOptions = {
      method: 'GET',
      url: 'https://booking-com.p.rapidapi.com/v1/hotels/room-list',
      params: {
        hotel_id: hotelId,
        currency: 'SGD',
        checkout_date: checkoutDate,
        locale: 'en-gb',
        checkin_date: checkinDate,
        adults_number_by_rooms: pax,
        units: 'metric'
      },
      headers: {
        'X-RapidAPI-Key': 'e15a5fc2d8msh9914d1f214b4e02p1ea8b4jsndf09beae5d59',
        'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
      }
    };

    const roomResponse = await makeApiRequestWithRateLimit(roomOptions, 3000);
    const roomData = roomResponse;
    //console.log("room data:", roomData);
    //console.error(error);
    res.status(404).render('404');
  }
});

// Hotel information page
router.get('/:id', (req, res) => {
  const tripDetails = {
      hotelId: req.params.id,
      currency: 'SGD',
      checkIn: req.query.checkin,
      checkOut: req.query.checkout,
      adults: req.query.adults
  };

  getHotelData('getPropertyDetails', tripDetails)
  .then(propertyResponse => {
    const propertyDetails = propertyResponse.data.data;
    console.log(propertyDetails);
    res.render('hotelInfo', {user: req.session.user, tripDetails: tripDetails, propertyDetails: propertyDetails});
  });
});

// Book hotel
router.post('/:id/book', async (req, res) => {
  try {
      const bookingData = {
          hotelId: req.params.id,
          hotelImage: req.body.hotelImage,
          hotelName: req.body.hotelName,
          checkIn: req.body.checkin,
          checkOut: req.body.checkout,
          pax: req.body.adults,
          checkOutDate: req.body.checkOutDate,
          checkInDate: req.body.checkInDate,
          hotelAddress: req.body.hotelAddress,
          userId: req.session.user.uid
      };

      // Add the booking data to the database
      const bookingRef = await db.collection('hotel').add(bookingData);

      // Respond with the booking ID
      res.status(201).json({ bookingId: bookingRef.id });
  } catch (error) {
      console.error('Error booking hotel:', error);
      res.status(500).json({ error: 'An error occurred while booking the hotel.' });
  }
});

module.exports = router;