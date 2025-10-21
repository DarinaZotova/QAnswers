// backend/routes/categories.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/categories.controller');
const auth = require('../middlewares/auth');

router.get('/', ctrl.list);
router.get('/:category_id', ctrl.getById);
router.get('/:category_id/posts', ctrl.getPosts);
router.post('/', auth, ctrl.create);
router.patch('/:category_id', auth, ctrl.update);
router.delete('/:category_id', auth, ctrl.remove);

module.exports = router;
