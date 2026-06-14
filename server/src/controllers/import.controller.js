const { processCsvImport } = require('../services/import.service');
const { sendSuccess, createError } = require('../utils/response');

async function importCsv(req, res, next) {
  try {
    if (!req.file) {
      throw createError('No CSV file uploaded', 400);
    }
    
    // We optionally accept groupId in the body
    const { groupId } = req.body;

    const report = await processCsvImport(req.file.path, groupId, req.user);
    
    sendSuccess(res, report);
  } catch (error) {
    next(error);
  }
}

module.exports = { importCsv };
