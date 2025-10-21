// backend/routes/posts.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/posts.controller');
const auth = require('../middlewares/auth');
const postImages = require('../middlewares/postImages');
const optionalAuth = require('../middlewares/optionalAuth');

router.get('/', ctrl.list);

router.get('/:post_id', optionalAuth, ctrl.getById);
router.get('/:post_id/comments', optionalAuth, ctrl.getComments);
router.get('/:post_id/categories', optionalAuth, ctrl.getCategories);
router.get('/:post_id/like', optionalAuth, ctrl.getLikes);
router.patch('/:post_id/comments/:comment_id/status', auth, ctrl.updateCommentStatus);
router.post('/:post_id/comments', auth, ctrl.createComment);
router.post('/:post_id/like', auth, ctrl.likeOrDislike);
router.patch('/:post_id', auth, ctrl.update);
router.delete('/:post_id', auth, ctrl.remove);
router.delete('/:post_id/like', auth, ctrl.unlike);

router.post('/', auth, postImages.array('images', 5), ctrl.create);


module.exports = router;
