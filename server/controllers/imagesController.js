const db = require('../db/oracleConnection');
const oracledb = require('oracledb');

// Get all images for a listing
exports.getListingImages = async (req, res) => {
  try {
    const { listingId } = req.params;
    
    const result = await db.execute(
      `BEGIN get_listing_images(:listing_id, :cursor); END;`,
      {
        listing_id: listingId,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
      }
    );
    
    const cursor = result.outBinds.cursor;
    const images = await cursor.getRows(1000); // Get up to 1000 images
    await cursor.close();
    
    res.json(images);
  } catch (err) {
    console.error('Get listing images error:', err);
    res.status(500).json({ error: 'Failed to fetch listing images', details: err.message });
  }
};

// Add image to listing
exports.addImage = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { image_url, image_name, image_size, image_width, image_height, is_primary, sort_order } = req.body;
    
    const result = await db.execute(
      `BEGIN add_image(:listing_id, :image_url, :image_name, :image_size, :image_width, :image_height, :is_primary, :sort_order, :image_id); END;`,
      {
        listing_id: listingId,
        image_url: image_url,
        image_name: image_name || null,
        image_size: image_size || null,
        image_width: image_width || null,
        image_height: image_height || null,
        is_primary: is_primary || 0,
        sort_order: sort_order || 0,
        image_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    
    const imageId = result.outBinds.image_id[0];
    
    // Get the created image
    const imageResult = await db.execute(
      `SELECT * FROM images WHERE image_id = :image_id`,
      { image_id: imageId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.status(201).json(imageResult.rows[0]);
  } catch (err) {
    console.error('Add image error:', err);
    res.status(500).json({ error: 'Failed to add image', details: err.message });
  }
};

// Update image
exports.updateImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { image_name, is_primary, sort_order } = req.body;
    
    const fields = [];
    const binds = { image_id: imageId };
    
    if (image_name !== undefined) {
      fields.push('image_name = :image_name');
      binds.image_name = image_name;
    }
    
    if (is_primary !== undefined) {
      fields.push('is_primary = :is_primary');
      binds.is_primary = is_primary;
    }
    
    if (sort_order !== undefined) {
      fields.push('sort_order = :sort_order');
      binds.sort_order = sort_order;
    }
    
    if (fields.length === 0) {
      return res.json({ message: 'No fields to update' });
    }
    
    await db.execute(
      `UPDATE images SET ${fields.join(', ')}, updated_at = SYSTIMESTAMP WHERE image_id = :image_id`,
      binds
    );
    
    // Get updated image
    const result = await db.execute(
      `SELECT * FROM images WHERE image_id = :image_id`,
      { image_id: imageId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update image error:', err);
    res.status(500).json({ error: 'Failed to update image', details: err.message });
  }
};

// Delete image
exports.deleteImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    
    await db.execute(`DELETE FROM images WHERE image_id = :image_id`, { image_id: imageId });
    
    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    console.error('Delete image error:', err);
    res.status(500).json({ error: 'Failed to delete image', details: err.message });
  }
};

// Reorder images for a listing
exports.reorderImages = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { imageIds } = req.body; // Array of image IDs in new order
    
    if (!Array.isArray(imageIds)) {
      return res.status(400).json({ error: 'imageIds must be an array' });
    }
    
    // Update sort order for each image
    for (let i = 0; i < imageIds.length; i++) {
      await db.execute(
        `UPDATE images SET sort_order = :sort_order WHERE image_id = :image_id AND listing_id = :listing_id`,
        {
          sort_order: i,
          image_id: imageIds[i],
          listing_id: listingId
        }
      );
    }
    
    res.json({ message: 'Images reordered successfully' });
  } catch (err) {
    console.error('Reorder images error:', err);
    res.status(500).json({ error: 'Failed to reorder images', details: err.message });
  }
};

// Set primary image
exports.setPrimaryImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    
    // First, get the listing_id for this image
    const imageResult = await db.execute(
      `SELECT listing_id FROM images WHERE image_id = :image_id`,
      { image_id: imageId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (imageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    const listingId = imageResult.rows[0].LISTING_ID;
    
    // Remove primary flag from all images in this listing
    await db.execute(
      `UPDATE images SET is_primary = 0 WHERE listing_id = :listing_id`,
      { listing_id: listingId }
    );
    
    // Set this image as primary
    await db.execute(
      `UPDATE images SET is_primary = 1 WHERE image_id = :image_id`,
      { image_id: imageId }
    );
    
    res.json({ message: 'Primary image set successfully' });
  } catch (err) {
    console.error('Set primary image error:', err);
    res.status(500).json({ error: 'Failed to set primary image', details: err.message });
  }
};
