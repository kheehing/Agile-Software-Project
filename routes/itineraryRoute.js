const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

router.get('', (req, res) => {
  res.render('itinerary');
});

router.get('/p', (req, res) => {
  res.render('planning');
});

// Create (Add) a Trip
router.post('/trip/:userid/destinations', async (req, res) => {
  const userId = req.params.userid;
  const { destinations = [], fromDate, toDate, sharedWith = [] } = req.body;

  const tripData = {
    destinations,
    fromDate,
    toDate,
    userId,
    sharedWith
  };
  console.log(destinations);
  console.log(fromDate);
  console.log(toDate);
  console.log(userId);
  console.log(sharedWith);

  try {
    await db.collection('itinerary').add(tripData);
    res.status(201).json({ message: 'Trip added successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while adding the trip.' });
  }
});

// Read (Get) a Trip
router.get('/trip/destinations', async (req, res) => {
  const userId = req.session.user.uid;

  try {
    const ownedTripsQuery = db.collection('itinerary').where('userId', '==', userId);
    const sharedTripsQuery = db.collection('itinerary').where('sharedWith', 'array-contains', userId);

    const [ownedTripsSnapshot, sharedTripsSnapshot] = await Promise.all([
      ownedTripsQuery.get(),
      sharedTripsQuery.get()
    ]);

    const ownedTrips = ownedTripsSnapshot.docs.map(doc => doc.data());
    const sharedTrips = sharedTripsSnapshot.docs.map(doc => doc.data());

    const trips = [...ownedTrips, ...sharedTrips];
    console.log("read itinerary ItineraryRoute.js");
    console.log(trips);
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while retrieving the trip.' });
  }
});


// Update (Edit) a Trip  NEED TO UPDATE
router.put('/trip/:userid/destinations/:tripId', async (req, res) => {
  const userId = req.params.userid;
  const tripId = req.params.tripId;
  const { destinations = [], fromDate, toDate, sharedWith = [] } = req.body;

  try {
    const tripRef = db.collection('itinerary').doc(tripId);
    await tripRef.update({ destinations, fromDate, toDate, sharedWith });
    res.status(200).json({ message: 'Trip updated successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while updating the trip.' });
  }
});

// Delete a Trip NEED TO UPDATED
router.delete('/trip/:userid/destinations/:tripId', async (req, res) => {
  const userId = req.params.userid;
  const tripId = req.params.tripId;

  try {
    const tripRef = db.collection('itinerary').doc(tripId);
    await tripRef.delete();
    res.status(200).json({ message: 'Trip deleted successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while deleting the trip.' });
  }
});


//  =============================================================
//  ========== Redirect nonexistent MUST BE LAST ROUTE ==========
//  =============================================================

router.get("*", (req, res) => {
  res.status(404).render("404");
});

module.exports = router;