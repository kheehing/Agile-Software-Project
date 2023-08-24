const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

router.get('', async (req, res) => {
    try {
        const airbnbBookingsSnapshot = await db.collection('airbnb').where('userId', '==', req.session.user.uid).get();
        const airbnbBookings = airbnbBookingsSnapshot.docs.map(doc => ({bookingId: doc.id, ...doc.data()}));
        const flightBookingsSnapshot = await db.collection('flights').where('userid', '==', req.session.user.uid).get();
        const flightBookings = flightBookingsSnapshot.docs.map(doc => ({bookingId: doc.id, ...doc.data()}));

        res.render('bookings', {user: req.session.user, airbnbBookings: airbnbBookings, flightBookings: flightBookings});
    }
    catch {
        console.error('An error occurred while retrieving the bookings.');
        res.render('bookings', {user: req.session.user, airbnbBookings: [], flightBookings: []});
    }
});

router.delete('/delete/:bookingType/:bookingId', async (req, res) => {
    try {
        await db.collection(req.params.bookingType).doc(req.params.bookingId).delete();
        res.redirect('/bookings');
    }
    catch {
        console.error('An error occurred while deleting the booking.');
    }
});

//  =============================================================
//  ========== Redirect nonexistent MUST BE LAST ROUTE ==========
//  =============================================================

router.get("*", (req, res) => {
  res.status(404).render("404");
});

module.exports = router;