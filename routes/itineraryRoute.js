const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

router.get('', (req, res) => {
  res.render('itinerary', { user: req.session.user });
});

router.get('/p', async (req, res) => {
  const tripId = req.query.tripId;
  let tripLengthInDays = 0;
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
    // Calculate tripLengthInDays
    const fromDate = new Date(tripData.fromDate);
    const toDate = new Date(tripData.toDate);
    
    if (fromDate != "Invalid Date" && toDate != "Invalid Date") {
      tripLengthInDays = Math.floor((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
    }
  }

  res.render('planning', { user: req.session.user, trip: tripData, tripId: tripId, tripLengthInDays: tripLengthInDays });
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

// Update (Edit) a Trip
router.put('/trip/:userId/destinations/:tripId', async (req, res) => {
  const userId = req.params.userId;
  const tripId = req.params.tripId;
  const updatedTripData = req.body;

  try {
    const tripRef = db.collection('itinerary').doc(tripId);
    const tripSnapshot = await tripRef.get();
    if (tripSnapshot.exists && tripSnapshot.data().userId === userId) {
      await tripRef.update(updatedTripData);
      res.status(200).json({ message: 'Trip updated successfully!' });
    } else {
      res.status(404).json({ error: 'Trip not found or unauthorized.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while updating the trip.' });
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

// Update (Add) a Place for a specific day in a Trip
router.put('/trip/:userId/destinations/:tripId/day/:dayNumber', async (req, res) => {
  const userId = req.params.userId;
  const tripId = req.params.tripId;
  const dayNumber = req.params.dayNumber;
  const { startTime, endTime, placeOfInterest, location, notes } = req.body;

  try {
    const tripRef = db.collection('itinerary').doc(tripId);
    const tripSnapshot = await tripRef.get();
    const daysCollection = tripRef.collection('days');
    const dayPlacesSnapshot = await daysCollection.where('day', '==', dayNumber).get();
    const newStartTime = convertTimeToNumber(startTime);
    const newEndTime = convertTimeToNumber(endTime);
    let hasTimeClash = false;
    dayPlacesSnapshot.forEach(placeDoc => {
      const placeData = placeDoc.data();
      console.log(placeData);
      const existingStartTime = convertTimeToNumber(placeData.startTime);
      const existingEndTime = convertTimeToNumber(placeData.endTime);
      console.log(`Comparing New: ${newStartTime}-${newEndTime} with Existing: ${existingStartTime}-${existingEndTime}`);
      if ((newStartTime < existingEndTime && newEndTime > existingStartTime) ||
        (newStartTime > existingEndTime && newEndTime < existingStartTime) ||
        (newStartTime >= existingStartTime && newStartTime < existingEndTime) ||
        (newEndTime > existingStartTime && newEndTime <= existingEndTime)) {
        console.log("hasTimeClash");
        hasTimeClash = true;
      }
    });

    if (hasTimeClash) {
        return res.status(400).json({ error: 'Time clash detected with an existing itinerary.' });
    }

    if (tripSnapshot.exists && tripSnapshot.data().userId === userId) {
        const daysCollection = tripRef.collection('days');
        const lastEdited = new Date().toISOString();
        await daysCollection.add({
            startTime,
            lastEdited,
            endTime,
            placeOfInterest,
            location,
            notes,
            day: parseInt(dayNumber)
        });
        res.status(200).json({ message: 'Place added successfully!' });
    } else if (!tripSnapshot.exists) {
      const timeCreated = new Date().toISOString();
      const lastEdited = timeCreated;
      await tripRef.set({
          userId,
          lastEdited,
          startTime,
          endTime,
          placeOfInterest,
          location,
          notes,
          day: parseInt(dayNumber)
      });
      const dayRef = tripRef.collection('days');
      await dayRef.set({
          startTime,
          endTime,
          placeOfInterest,
          location,
          notes,
          day: parseInt(dayNumber)
      });
      res.status(201).json({ message: 'New trip and place added successfully!' });
    } else {
      res.status(403).json({ error: 'Unauthorized to update this trip.' });
    }
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
});

router.get('/trip/places/:tripId/day/:dayNumber', async (req, res) => {
  const tripId = req.params.tripId;
  const dayNumber = parseInt(req.params.dayNumber);

  try {
    const placesRef = db.collection('itinerary').doc(tripId).collection('days');
    const placesSnapshot = await placesRef.get();

    if (!placesSnapshot.empty) {
      const placesArray = [];
      placesSnapshot.forEach(placeDoc => {
        const placeData = placeDoc.data();
        if (placeData.day === dayNumber) {
          placesArray.push({
            id: placeDoc.id,
            ...placeData
          });
        }
      });

      placesArray.sort((a, b) => {
          return convertTimeToNumber(a.startTime) - convertTimeToNumber(b.startTime);
      });

      if (placesArray.length > 0) {
          res.status(200).json(placesArray);
      } else {
          res.status(406).json({ error: 'No places found for the specified day.' });
      }
    } else {
        res.status(404).json({ error: 'No places found for the specified day.' });
    }
      
  } catch (error) {
      console.error('Error fetching places:', error);
      res.status(500).json({ error: 'An error occurred while fetching the places.' });
  }
});

const convertTimeToNumber = (time) => {
  return parseInt(time.replace(":", ""));
};

//  =============================================================
//  ========== Redirect nonexistent MUST BE LAST ROUTE ==========
//  =============================================================

router.get("*", (req, res) => {
  res.status(404).render("404");
});

module.exports = router;