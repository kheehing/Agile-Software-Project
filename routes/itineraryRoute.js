const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Create (Add) a Trip
router.post('/trip/:userid/destination', async (req, res) => {
  const userId = req.params.userid;
  const { destination, fromDate, toDate } = req.body;

  const tripData = {
    destination,
    fromDate,
    toDate,
    userId
  };

  try {
    await db.collection('trips').add(tripData);
    res.status(201).json({ message: 'Trip added successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while adding the trip.' });
  }
});

// Read (Get) a Trip
router.get('/trip/:userid/destination', async (req, res) => {
  const userId = req.params.userid;

  try {
    const querySnapshot = await db.collection('trips').where('userId', '==', userId).get();
    const trips = querySnapshot.docs.map(doc => doc.data());
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while retrieving the trip.' });
  }
});

// Update (Edit) a Trip
router.put('/trip/:userid/destination/:tripId', async (req, res) => {
  const userId = req.params.userid;
  const tripId = req.params.tripId;
  const { destination, fromDate, toDate } = req.body;

  try {
    const tripRef = db.collection('trips').doc(tripId);
    await tripRef.update({ destination, fromDate, toDate });
    res.status(200).json({ message: 'Trip updated successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while updating the trip.' });
  }
});

// Delete a Trip
router.delete('/trip/:userid/destination/:tripId', async (req, res) => {
  const userId = req.params.userid;
  const tripId = req.params.tripId;

  try {
    const tripRef = db.collection('trips').doc(tripId);
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