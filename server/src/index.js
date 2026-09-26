require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`🚀 ATK POS Server running on http://localhost:${PORT}`);
  console.log(`📦 Database: MySQL (${process.env.DATABASE_URL})`);
  console.log(`===========================================`);
});
