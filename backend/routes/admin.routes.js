// backend/routes/admin.routes.js
const router = require('express').Router();
const auth = require('../middlewares/auth');
const requireAdmin = require('../middlewares/requireAdmin');
const adminCtrl = require('../controllers/admin.controller');

router.use(auth, requireAdmin);
router.get('/posts', adminCtrl.listPosts);
router.get('/posts/:post_id', adminCtrl.getPostById);
router.get('/posts/:post_id/comments', adminCtrl.listPostComments);

module.exports = router;
