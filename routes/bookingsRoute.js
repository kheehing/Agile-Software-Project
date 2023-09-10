const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Retrieve bookings
router.get('', async (req, res) => {
    try {
        const itinerariesSnapshot = await db.collection('itinerary').where('userId', '==', req.session.user.uid).get();
        const itineraries = itinerariesSnapshot.docs.map(doc => ({itineraryId: doc.id, ...doc.data()}));
        const airbnbBookingsSnapshot = await db.collection('airbnb').where('userId', '==', req.session.user.uid).get();
        var airbnbBookings = airbnbBookingsSnapshot.docs.map(doc => ({bookingId: doc.id, ...doc.data()}));
        const hotelBookingsSnapshot = await db.collection('hotel').where('userId', '==', req.session.user.uid).get();
        var hotelBookings = hotelBookingsSnapshot.docs.map(doc => ({bookingId: doc.id, ...doc.data()}));
        const flightBookingsSnapshot = await db.collection('flights').where('userid', '==', req.session.user.uid).get();
        var flightBookings = flightBookingsSnapshot.docs.map(doc => ({bookingId: doc.id, ...doc.data()}));
        flightBookings.forEach(flightBooking => {
            itineraries.forEach(flightItinerary => {
                if (flightBooking.itineraryId && flightBooking.itineraryId == flightItinerary.itineraryId) {
                    flightBooking.itineraryName = flightItinerary.tripName;
                }
            });
        });
        airbnbBookings.forEach(booking => {
            itineraries.forEach(itinerary => {
                if (booking.itineraryId && booking.itineraryId == itinerary.itineraryId) {
                    booking.itineraryName = itinerary.tripName;
                }
            });
        });
        hotelBookings.forEach(hotelBooking => {
            itineraries.forEach(hotelItinerary => {
                if (hotelBooking.itineraryId && hotelBooking.itineraryId == hotelItinerary.itineraryId) {
                    hotelBooking.itineraryName = hotelItinerary.tripName;
                }
            });
        });
        res.render('bookings', {user: req.session.user, airbnbBookings: airbnbBookings, flightBookings: flightBookings, hotelBookings: hotelBookings});
    }
    catch (error) {
        res.status(500).json({error: 'An error occurred while retrieving the bookings.'});
        res.render('bookings', {user: req.session.user, airbnbBookings: [], flightBookings: [], hotelBookings: []});
    }
});

// Update booking
router.put('/update/:bookingType/:bookingId', async (req, res) => {
    try {
        await db.collection(req.params.bookingType).doc(req.params.bookingId).update(req.body);
        res.status(200).json({message: 'Update successful!'});
    }
    catch (error) {
        res.status(500).json({error: 'An error occurred while updating the booking.'});
    }
});

// Delete booking
router.delete('/delete/:bookingType/:bookingId', async (req, res) => {
    try {
        await db.collection(req.params.bookingType).doc(req.params.bookingId).delete();
        res.redirect('/bookings');
    }
    catch (error) {
        res.status(500).json({error: 'An error occurred while deleting the booking.'});
    }
});

//  =============================================================
//  ========== Redirect nonexistent MUST BE LAST ROUTE ==========
//  =============================================================

router.get("*", (req, res) => {
  res.status(404).render("404");
});

module.exports = router;