const app = require('../backend/src/server');
const db = require('../backend/src/db');

let isDbInitialized = false;

module.exports = async (req, res) => {
  if (!isDbInitialized) {
    try {
      await db.initDb();
    } catch (err) {
      console.error('Error inicializando base de datos en Vercel Serverless:', err);
    }
    isDbInitialized = true;
  }
  return app(req, res);
};
