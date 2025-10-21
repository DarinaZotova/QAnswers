//backend/routes/users.routes.js
const router = require('express').Router();
const usersCtrl = require('../controllers/users.controller');
const auth = require('../middlewares/auth');
const { requireAdmin, requireSelfOrAdmin } = require('../middlewares/permissions');
const upload = require('../middlewares/upload');

router.get('/', usersCtrl.list);
router.get('/:user_id', usersCtrl.getById);
router.post('/', auth, requireAdmin, usersCtrl.createByAdmin);
router.patch('/avatar', auth, upload.single('avatar'), usersCtrl.updateAvatar);
router.patch('/:user_id', auth, requireSelfOrAdmin, usersCtrl.update);
router.delete('/:user_id', auth, requireSelfOrAdmin, usersCtrl.remove);

module.exports = router;
