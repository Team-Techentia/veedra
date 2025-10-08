const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const router = express.Router();

// All routes protected and allow owner/manager access
router.use(protect);
router.use(authorize('owner', 'manager'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(authorize('owner'), deleteUser); // Only owner can delete

module.exports = router;