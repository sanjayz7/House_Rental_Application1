const db = require('../db/oracleConnection');
const oracledb = require('oracledb');

// Format date for Oracle
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

// Get all shows
exports.getAllShows = async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT * FROM theater_shows ORDER BY show_date, start_time`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching shows:', err);
    res.status(500).json({ error: 'Failed to fetch shows', details: err.message });
  }
};

// Get show by ID
exports.getShowById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.execute(
      `SELECT * FROM theater_shows WHERE show_id = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Show not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching show:', err);
    res.status(500).json({ error: 'Failed to fetch show', details: err.message });
  }
};

// Create a new show
exports.createShow = async (req, res) => {
  try {
    const {
      title,
      description,
      show_date,
      start_time,
      end_time,
      price,
      total_seats,
      venue,
      category
    } = req.body;

    // Validate required fields
    if (!title || !show_date || !start_time || !price || !total_seats || !venue) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Using stored procedure to add a show
    const result = await db.execute(
      `BEGIN
        add_show(
          :title, :description, TO_DATE(:show_date, 'YYYY-MM-DD'),
          :start_time, :end_time, :price, :total_seats,
          :venue, :category, :show_id
        );
       END;`,
      {
        title,
        description: description || '',
        show_date: formatDate(show_date),
        start_time,
        end_time: end_time || '',
        price,
        total_seats,
        venue,
        category: category || '',
        show_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );

    const showId = result.outBinds.show_id[0];
    
    // Fetch the newly created show
    const newShow = await db.execute(
      `SELECT * FROM theater_shows WHERE show_id = :id`,
      [showId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.status(201).json(newShow.rows[0]);
  } catch (err) {
    console.error('Error creating show:', err);
    res.status(500).json({ error: 'Failed to create show', details: err.message });
  }
};

// Update a show
exports.updateShow = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      show_date,
      start_time,
      end_time,
      price,
      total_seats,
      available_seats,
      venue,
      category
    } = req.body;

    // Validate required fields
    if (!title || !show_date || !start_time || !price || !total_seats || !venue) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if show exists
    const check = await db.execute(
      `SELECT show_id FROM theater_shows WHERE show_id = :id`,
      [id]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Show not found' });
    }

    // Using stored procedure to update a show
    await db.execute(
      `BEGIN
        update_show(
          :show_id, :title, :description, TO_DATE(:show_date, 'YYYY-MM-DD'),
          :start_time, :end_time, :price, :total_seats, :available_seats,
          :venue, :category
        );
       END;`,
      {
        show_id: id,
        title,
        description: description || '',
        show_date: formatDate(show_date),
        start_time,
        end_time: end_time || '',
        price,
        total_seats,
        available_seats,
        venue,
        category: category || ''
      }
    );
    
    // Fetch the updated show
    const updatedShow = await db.execute(
      `SELECT * FROM theater_shows WHERE show_id = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.json(updatedShow.rows[0]);
  } catch (err) {
    console.error('Error updating show:', err);
    res.status(500).json({ error: 'Failed to update show', details: err.message });
  }
};

// Delete a show
exports.deleteShow = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if show exists
    const check = await db.execute(
      `SELECT show_id FROM theater_shows WHERE show_id = :id`,
      [id]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Show not found' });
    }

    // Using stored procedure to delete a show
    await db.execute(
      `BEGIN
        delete_show(:show_id);
       END;`,
      { show_id: id }
    );
    
    res.json({ message: 'Show deleted successfully' });
  } catch (err) {
    console.error('Error deleting show:', err);
    res.status(500).json({ error: 'Failed to delete show', details: err.message });
  }
};