const express = require('express');
const { body, param } = require('express-validator');

const router = express.Router();
const reviews = require('../controllers/reviews.controller');
const authMW = require('../middleware/auth');

router.get('/listing/:listingId',
  [param('listingId').trim().notEmpty()],
  reviews.getForListing);

router.get('/user/:userId',
  [param('userId').trim().notEmpty()],
  reviews.getForUser);

router.post('/', authMW,
  [
    body('listingId').trim().notEmpty(),
    body('rating').isInt({ min: 1, max: 5 }).toInt(),
    body('comment').trim().notEmpty(),
  ],
  reviews.create);

module.exports = router;