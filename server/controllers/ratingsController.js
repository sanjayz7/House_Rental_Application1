const db = require('../db/oracleConnection');
const oracledb = require('oracledb');

exports.submitRating = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { score } = req.body;
    const userId = req.user.userId;
    if (!score || score < 1 || score > 5) return res.status(400).json({ error: 'Score must be 1-5' });
    // Upsert by unique (listing_id, user_id)
    const existing = await db.execute(`SELECT rating_id FROM ratings WHERE listing_id = :listingId AND user_id = :userId`, { listingId, userId });
    if (existing.rows.length) {
      await db.execute(`UPDATE ratings SET score = :score, created_at = SYSTIMESTAMP WHERE rating_id = :id`, { score, id: existing.rows[0][0] });
    } else {
      await db.execute(`INSERT INTO ratings (listing_id, user_id, score) VALUES (:listingId, :userId, :score)`, { listingId, userId, score });
    }
    res.json({ message: 'Rating saved' });
  } catch (err) {
    console.error('Submit rating error:', err);
    res.status(500).json({ error: 'Failed to submit rating', details: err.message });
  }
};

exports.getListingRatings = async (req, res) => {
  try {
    const { listingId } = req.params;
    const r = await db.execute(
      `SELECT r.rating_id, r.user_id, r.score, r.created_at, u.name FROM ratings r JOIN users u ON u.user_id = r.user_id WHERE r.listing_id = :listingId ORDER BY r.created_at DESC`,
      { listingId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(r.rows);
  } catch (err) {
    console.error('Get ratings error:', err);
    res.status(500).json({ error: 'Failed to fetch ratings', details: err.message });
  }
};

exports.getListingAverage = async (req, res) => {
  try {
    const { listingId } = req.params;
    const r = await db.execute(`SELECT AVG(score) AS avg_score, COUNT(*) AS cnt FROM ratings WHERE listing_id = :listingId`, { listingId }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const row = r.rows[0] || { AVG_SCORE: null, CNT: 0 };
    res.json({ average: row.AVG_SCORE, count: row.CNT });
  } catch (err) {
    console.error('Get average rating error:', err);
    res.status(500).json({ error: 'Failed to fetch average rating', details: err.message });
  }
};
