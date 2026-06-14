const express = require('express');
const router = express.Router();
const multer = require('multer');
const os = require('os');

const { importCsv } = require('../controllers/import.controller');
const { authenticate } = require('../middleware/auth.middleware');

const upload = multer({ dest: os.tmpdir() });

router.use(authenticate);

router.post('/csv', upload.single('file'), importCsv);

module.exports = router;
