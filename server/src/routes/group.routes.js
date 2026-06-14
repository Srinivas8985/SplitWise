const express = require('express');
const router = express.Router();

const {
  createGroup,
  getGroups,
  getGroup,
  addMember,
  removeMember,
  leaveGroup,
  deleteGroup
} = require('../controllers/group.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { createGroupSchema, addMemberSchema } = require('../validators/group.validator');

// All group routes require authentication
router.use(authenticate);

// Group CRUD
router.post('/', validate(createGroupSchema), createGroup);
router.get('/', getGroups);
router.get('/:groupId', getGroup);
router.delete('/:groupId', deleteGroup);

// Member management
router.post('/:groupId/members', validate(addMemberSchema), addMember);
router.delete('/:groupId/members/:memberId', removeMember);
router.post('/:groupId/leave', leaveGroup);

module.exports = router;
