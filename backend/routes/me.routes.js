// backend/routes/me.routes.js
const router = require('express').Router();
const auth = require('../middlewares/auth');
const meCtrl = require('../controllers/me.controller');

router.get('/posts', auth, meCtrl.myPosts);
router.get('/comments', auth, meCtrl.myComments);

module.exports = router;
