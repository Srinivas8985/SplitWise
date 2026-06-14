const groupService = require('../services/group.service');
const { sendSuccess } = require('../utils/response');

async function createGroup(req, res, next) {
  try {
    const group = await groupService.createGroup(req.user.id, req.body);
    sendSuccess(res, { group }, 201);
  } catch (error) {
    next(error);
  }
}

async function getGroups(req, res, next) {
  try {
    const groups = await groupService.getUserGroups(req.user.id);
    sendSuccess(res, { groups });
  } catch (error) {
    next(error);
  }
}

async function getGroup(req, res, next) {
  try {
    const group = await groupService.getGroupById(req.params.groupId, req.user.id);
    sendSuccess(res, { group });
  } catch (error) {
    next(error);
  }
}

async function addMember(req, res, next) {
  try {
    const member = await groupService.addMember(req.params.groupId, req.user.id, req.body);
    sendSuccess(res, { member }, 201);
  } catch (error) {
    next(error);
  }
}

async function removeMember(req, res, next) {
  try {
    await groupService.removeMember(req.params.groupId, req.user.id, req.params.memberId);
    sendSuccess(res, { message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
}

async function leaveGroup(req, res, next) {
  try {
    await groupService.leaveGroup(req.params.groupId, req.user.id);
    sendSuccess(res, { message: 'Left group successfully' });
  } catch (error) {
    next(error);
  }
}

async function deleteGroup(req, res, next) {
  try {
    await groupService.deleteGroup(req.params.groupId, req.user.id);
    sendSuccess(res, { message: 'Group deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createGroup,
  getGroups,
  getGroup,
  addMember,
  removeMember,
  leaveGroup,
  deleteGroup
};
