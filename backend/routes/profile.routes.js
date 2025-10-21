// backend/routes/profile.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/profile.controller');

router.get('/:user_id', ctrl.getById);
router.get('/by-login/:login', ctrl.getByLogin);

module.exports = router;
