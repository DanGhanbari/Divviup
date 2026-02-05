const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware); // Protect all group routes

router.post('/', groupController.createGroup);
router.get('/', groupController.getUserGroups);
router.get('/:id', groupController.getGroupById);
router.post('/:id/members', groupController.addMember);
router.delete('/:id', groupController.deleteGroup);
router.post('/:id/invite', groupController.sendInvitation);
router.get('/:id/report', groupController.generateGroupReport);
router.delete('/:id/members/:userId', groupController.removeMember);

module.exports = router;
