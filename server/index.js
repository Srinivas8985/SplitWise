/**
 * SplitWise Pro — Server Entry Point
 */

require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 SplitWise Pro server running on port ${PORT}`);
});
