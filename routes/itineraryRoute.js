const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

router.get('', (req, res) => {
  res.render('itinerary', { user: req.session.user });
});

router.get('/p', async (req, res) => {
  const tripId = req.query.tripId;
  let tripData = null;

  if (tripId) {
    try {
      const tripRef = db.collection('itinerary').doc(tripId);
      const tripSnapshot = await tripRef.get();
      if (tripSnapshot.exists) {
        tripData = tripSnapshot.data();
        const currentUser = req.session.user.uid;
        if (tripData.userId !== currentUser && !tripData.sharedWith.includes(currentUser)) {
          res.status(403).render('error', { message: 'You do not have permission to view this trip.' });
          return;
        }
      }
    } catch (error) {
      console.error('An error occurred while retrieving the trip:', error);
    }
  }

  res.render('planning', { user: req.session.user, trip: tripData });
});

// Create (Add) a Trip
router.post('/trip/:userid/destinations', async (req, res) => {
  const userId = req.params.userid;
  const { destinations = [], fromDate, toDate, tripName, sharedWith = [] } = req.body;

  const timeCreated = new Date().toISOString();
  const lastEdited = timeCreated;

  const tripData = {
    userId,
    destinations,
    sharedWith,
    fromDate,
    toDate,
    tripName,
    timeCreated,
    lastEdited
  };

  try {
    await db.collection('itinerary').add(tripData);
    res.status(201).json({ message: 'Trip added successfully!' });
    console.log(`${tripName} is added to db.`);
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

    const ownedTrips = ownedTripsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const sharedTrips = sharedTripsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const trips = [...ownedTrips, ...sharedTrips];
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while retrieving the trip.' });
  }
});

// Delete (Remove) a Trip
router.delete('/trip/:userId/destinations/:tripId', async (req, res) => {
  const userId = req.params.userId;
  const tripId = req.params.tripId;

  try {
    const tripRef = db.collection('itinerary').doc(tripId);
    const tripSnapshot = await tripRef.get();
    if (tripSnapshot.exists && tripSnapshot.data().userId === userId) {
      await tripRef.delete();
      res.status(200).json({ message: 'Trip deleted successfully!' });
    } else {
      res.status(404).json({ error: 'Trip not found or unauthorized.' });
    }
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