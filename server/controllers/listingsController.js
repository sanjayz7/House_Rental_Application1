const db = require('../db/oracleConnection');
const oracledb = require('oracledb');

exports.getAllListings = async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT * FROM listings ORDER BY created_at DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Get all listings error:', err);
    res.status(500).json({ error: 'Failed to fetch listings', details: err.message });
  }
};

exports.searchListings = async (req, res) => {
  try {
    const { q, minPrice, maxPrice, category, furnished, verified, minBeds, minBaths, page = 1, pageSize = 20 } = req.query;
    const binds = {};
    const where = [];
    if (q) { where.push("(LOWER(title) LIKE LOWER('%' || :q || '%') OR LOWER(address) LIKE LOWER('%' || :q || '%') OR LOWER(description) LIKE LOWER('%' || :q || '%'))"); binds.q = q; }
    if (minPrice) { where.push('price >= :minPrice'); binds.minPrice = Number(minPrice); }
    if (maxPrice) { where.push('price <= :maxPrice'); binds.maxPrice = Number(maxPrice); }
    if (category) { where.push('category = :category'); binds.category = category; }
    if (furnished) { where.push('furnished = :furnished'); binds.furnished = furnished; }
    if (verified) { where.push('verified = 1'); }
    if (minBeds) { where.push('bedrooms >= :minBeds'); binds.minBeds = Number(minBeds); }
    if (minBaths) { where.push('bathrooms >= :minBaths'); binds.minBaths = Number(minBaths); }

    const base = `FROM listings ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;
    const offset = (Number(page) - 1) * Number(pageSize);

    const total = await db.execute(`SELECT COUNT(*) AS total ${base}`, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const rows = await db.execute(
      `SELECT * ${base} ORDER BY available_from NULLS LAST, created_at DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { ...binds, offset, limit: Number(pageSize) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({ total: total.rows[0].TOTAL, items: rows.rows });
  } catch (err) {
    console.error('Search listings error:', err);
    res.status(500).json({ error: 'Failed to fetch listings', details: err.message });
  }
};

exports.getListingById = async (req, res) => {
  try {
    const { id } = req.params;
    const r = await db.execute(`SELECT * FROM listings WHERE listing_id = :id`, { id }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    if (r.rows.length === 0) return res.status(404).json({ error: 'Listing not found' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error('Get listing error:', err);
    res.status(500).json({ error: 'Failed to fetch listing', details: err.message });
  }
};

exports.createListing = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const b = req.body;
    const out = await db.execute(
      `BEGIN add_listing(
        :owner_id,:title,:description,:image_url,:address,:latitude,:longitude,
        :owner_phone,:bedrooms,:bathrooms,:area_sqft,:furnished,:verified,:deposit,
        :available_from,:contact_start,:contact_end,:price,:total_units,:available_units,
        :city,:category,:listing_id); END;`,
      {
        owner_id: ownerId,
        title: b.title,
        description: b.description || '',
        image_url: b.image_url || '',
        address: b.address || '',
        latitude: b.latitude || null,
        longitude: b.longitude || null,
        owner_phone: b.owner_phone || '',
        bedrooms: b.bedrooms || null,
        bathrooms: b.bathrooms || null,
        area_sqft: b.area_sqft || null,
        furnished: b.furnished || '',
        verified: b.verified ? 1 : 0,
        deposit: b.deposit || null,
        available_from: b.show_date ? new Date(b.show_date) : null,
        contact_start: b.start_time || null,
        contact_end: b.end_time || null,
        price: b.price,
        total_units: b.total_seats || 1,
        available_units: b.available_seats || 1,
        city: b.venue || '',
        category: b.category || '',
        listing_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    const id = out.outBinds.listing_id[0];
    
    // Handle multiple images if provided
    if (b.images && Array.isArray(b.images) && b.images.length > 0) {
      for (let i = 0; i < b.images.length; i++) {
        const image = b.images[i];
        await db.execute(
          `BEGIN add_image(:listing_id, :image_url, :image_name, :image_size, :image_width, :image_height, :is_primary, :sort_order, :image_id); END;`,
          {
            listing_id: id,
            image_url: image.url || image.preview,
            image_name: image.name || null,
            image_size: image.size || null,
            image_width: image.dimensions?.width || null,
            image_height: image.dimensions?.height || null,
            is_primary: i === 0 ? 1 : 0, // First image is primary
            sort_order: i,
            image_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
          }
        );
      }
    }
    
    const r = await db.execute(`SELECT * FROM listings WHERE listing_id = :id`, { id }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('Create listing error:', err);
    res.status(500).json({ error: 'Failed to create listing', details: err.message });
  }
};

exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const b = req.body;
    const fields = [
      'title','description','image_url','address','latitude','longitude','owner_phone',
      'bedrooms','bathrooms','area_sqft','furnished','verified','deposit','available_from',
      'contact_start','contact_end','price','total_units','available_units','city','category'
    ];
    const setClauses = [];
    const binds = { id };
    fields.forEach(f => {
      if (b[f] !== undefined) {
        setClauses.push(`${f} = :${f}`);
        binds[f] = (f === 'available_from' && b.show_date) ? new Date(b.show_date) : b[f];
      }
    });
    if (setClauses.length === 0) return res.json({});
    await db.execute(
      `UPDATE listings SET ${setClauses.join(', ')}, updated_at = SYSTIMESTAMP WHERE listing_id = :id`,
      binds
    );
    const r = await db.execute(`SELECT * FROM listings WHERE listing_id = :id`, { id }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json(r.rows[0]);
  } catch (err) {
    console.error('Update listing error:', err);
    res.status(500).json({ error: 'Failed to update listing', details: err.message });
  }
};

exports.deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute(`DELETE FROM listings WHERE listing_id = :id`, { id });
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    console.error('Delete listing error:', err);
    res.status(500).json({ error: 'Failed to delete listing', details: err.message });
  }
};

exports.verifyListing = async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute(`UPDATE listings SET verified = 1, updated_at = SYSTIMESTAMP WHERE listing_id = :id`, { id });
    res.json({ message: 'Listing verified' });
  } catch (err) {
    console.error('Verify listing error:', err);
    res.status(500).json({ error: 'Failed to verify listing', details: err.message });
  }
};
