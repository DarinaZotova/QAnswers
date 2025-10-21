// backend/routes/comments.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/comments.controller');
const auth = require('../middlewares/auth');

router.get('/:comment_id', ctrl.getById);
router.get('/:comment_id/like', ctrl.getLikes);
router.post('/:comment_id/like', auth, ctrl.likeOrDislike);
router.delete('/:comment_id/like', auth, ctrl.unlike);
router.patch('/:comment_id', auth, ctrl.update);        
router.delete('/:comment_id', auth, ctrl.remove);

module.exports = router;
