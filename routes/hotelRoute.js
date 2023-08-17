const express = require('express');
const router = express.Router();
const axios = require('axios');

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
    res.render('hotel', { images });
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
        price_currency:
          hotelData.composite_price_breakdown.gross_amount_per_night.currency,
        price_per_night:
          hotelData.composite_price_breakdown.gross_amount_per_night.value.toFixed(2)
      }));

      return { hotelNames: hotelsData.map(hotel => hotel.hotel_name), hotelsData };
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
      adultsNumber: adultsNumber
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
    // Fetch hotel information using the Booking.com API based on hotelId
    const hotelOptions = {
      method: 'GET',
      url: 'https://booking-com.p.rapidapi.com/v1/hotels/description',
      params: {
        hotel_id: hotelId,
        descriptiontype_id: '6',
        locale: 'en-gb'
      },
      headers: {
        'X-RapidAPI-Key': 'e15a5fc2d8msh9914d1f214b4e02p1ea8b4jsndf09beae5d59',
        'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
      }
    };

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

    // Fetch hotel map data using the Booking.com API based on hotelId
    const mapOptions = {
      method: 'GET',
      url: 'https://booking-com.p.rapidapi.com/v1/hotels/map-markers',
      params: {
        hotel_id: hotelId,
        locale: 'en-gb'
      },
      headers: {
        'X-RapidAPI-Key': 'e15a5fc2d8msh9914d1f214b4e02p1ea8b4jsndf09beae5d59',
        'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
      }
    };

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
    const [imageResponse, hotelDataResponse, reviewResponse, roomResponse] = await Promise.all([
      axios.request(imageOptions),
      axios.request(hotelDataOptions),
      axios.request(reviewOptions),
      //axios.request(roomOptions),
    ]);

    console.log("hotel id: " + hotelId);

    const mapResponse = await axios.request(mapOptions);
    const mapData = mapResponse.data;

    const hotelImages = imageResponse.data;

    // Collect the top 8 url_max images
    const topImages = hotelImages
      .slice(1, 10)
      .map(item => (item.url_max) || '');

    const hotelLocation = hotelDataResponse.data.location;

    const hotelReviews = reviewResponse.data.result;

    //const roomData = roomResponse.data[0];

    axios.request(hotelOptions)
      .then(response => {
        const hotelDescription = response.data.description; // Hotel information here

        // Render the hotel information page and pass the retrieved data to the EJS template
        res.render('hotelInfo', {
          hotelDescription,
          hotelImages: topImages,
          mapData: mapData,
          hotelLocation: hotelLocation,
          hotelReviews: hotelReviews,
          //roomData: roomData,
          hotelId: hotelId
        });
      })
      .catch(error => {
        console.error(error);
        res.status(404).render('404');
      });

  } catch (error) {
    console.error(error);
    res.status(404).render('404');
  }
});

//  =============================================================
//  ========== Redirect nonexistent MUST BE LAST ROUTE ==========
//  =============================================================

module.exports = router;