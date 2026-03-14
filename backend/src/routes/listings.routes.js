const express = require('express');
const { body, param, query } = require('express-validator');
const { upload } = require('../services/s3.service');
const router = express.Router();
const listings = require('../controllers/listings.controller');
const authMW = require('../middleware/auth');

router.get('/',
  [
    query('available').optional().isBoolean().toBoolean(),
    query('featured').optional().isBoolean().toBoolean(),
    query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
    query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
    query('category').optional().trim(),
    query('location').optional().trim(),
  ],
  listings.getAll);

router.get('/search',
  [
    query('q').optional().trim(),
    query('category').optional().trim(),
    query('location').optional().trim(),
    query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
    query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
  ],
  listings.search);

router.get('/:id',
  [param('id').trim().notEmpty()],
  listings.getOne);

router.post('/', authMW,
  upload.array('images', 5),
  [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('category').trim().notEmpty(),
    body('condition').trim().notEmpty(),
    body('pricePerDay').isFloat({ min: 0 }).toFloat(),
    body('images').optional().isArray(),
    body('location').trim().notEmpty(),
    body('available').optional().isBoolean().toBoolean(),
    body('featured').optional().isBoolean().toBoolean(),
  ],
  listings.create);

router.put('/:id', authMW,
  [
    param('id').trim().notEmpty(),
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('category').optional().trim().notEmpty(),
    body('condition').optional().trim().notEmpty(),
    body('pricePerDay').optional().isFloat({ min: 0 }).toFloat(),
    body('images').optional().isArray(),
    body('location').optional().trim().notEmpty(),
    body('available').optional().isBoolean().toBoolean(),
    body('featured').optional().isBoolean().toBoolean(),
  ],
  listings.update);

router.delete('/:id', authMW,
  [param('id').trim().notEmpty()],
  listings.remove);

module.exports = router;