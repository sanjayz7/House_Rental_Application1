const db = require('./db/oracleConnection');

async function createImagesTable() {
  console.log('Creating IMAGES table for storing multiple property images...');
  
  try {
    // Check if IMAGES table already exists
    const tableExists = await db.execute(`
      SELECT table_name FROM user_tables WHERE table_name = 'IMAGES'
    `);
    
    if (tableExists.rows.length > 0) {
      console.log('✅ IMAGES table already exists');
      return;
    }
    
    // Create IMAGES table
    console.log('Creating IMAGES table...');
    await db.execute(`
      CREATE TABLE images (
        image_id NUMBER PRIMARY KEY,
        listing_id NUMBER NOT NULL,
        image_url VARCHAR2(4000) NOT NULL,
        image_name VARCHAR2(255),
        image_size NUMBER,
        image_width NUMBER,
        image_height NUMBER,
        is_primary NUMBER(1) DEFAULT 0,
        sort_order NUMBER DEFAULT 0,
        created_at DATE DEFAULT SYSDATE
      )
    `);
    
    // Create sequence for image_id
    await db.execute(`
      CREATE SEQUENCE images_seq START WITH 1 INCREMENT BY 1
    `);
    
    // Create trigger for auto-increment
    await db.execute(`
      CREATE OR REPLACE TRIGGER images_trigger
      BEFORE INSERT ON images
      FOR EACH ROW
      BEGIN
        IF :NEW.image_id IS NULL THEN
          :NEW.image_id := images_seq.NEXTVAL;
        END IF;
      END;
    `);
    
    // Add foreign key constraint separately
    await db.execute(`
      ALTER TABLE images 
      ADD CONSTRAINT fk_images_listing 
      FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE
    `);
    
    console.log('✅ IMAGES table created successfully');
    
    // Create indexes
    console.log('Creating indexes...');
    await db.execute('CREATE INDEX idx_images_listing ON images(listing_id)');
    await db.execute('CREATE INDEX idx_images_primary ON images(listing_id, is_primary)');
    await db.execute('CREATE INDEX idx_images_sort ON images(listing_id, sort_order)');
    
    console.log('✅ Indexes created successfully');
    
    // Create procedure to add image
    console.log('Creating add_image procedure...');
    await db.execute(`
      CREATE OR REPLACE PROCEDURE add_image(
        p_listing_id IN NUMBER,
        p_image_url IN VARCHAR2,
        p_image_name IN VARCHAR2 DEFAULT NULL,
        p_image_size IN NUMBER DEFAULT NULL,
        p_image_width IN NUMBER DEFAULT NULL,
        p_image_height IN NUMBER DEFAULT NULL,
        p_is_primary IN NUMBER DEFAULT 0,
        p_sort_order IN NUMBER DEFAULT 0,
        p_image_id OUT NUMBER
      ) AS
      BEGIN
        INSERT INTO images (
          listing_id, image_url, image_name, image_size, 
          image_width, image_height, is_primary, sort_order
        ) VALUES (
          p_listing_id, p_image_url, p_image_name, p_image_size,
          p_image_width, p_image_height, p_is_primary, p_sort_order
        ) RETURNING image_id INTO p_image_id;
      END;
    `);
    
    console.log('✅ add_image procedure created successfully');
    
    // Create procedure to get listing images
    console.log('Creating get_listing_images procedure...');
    await db.execute(`
      CREATE OR REPLACE PROCEDURE get_listing_images(
        p_listing_id IN NUMBER,
        p_cursor OUT SYS_REFCURSOR
      ) AS
      BEGIN
        OPEN p_cursor FOR
        SELECT image_id, image_url, image_name, image_size, 
               image_width, image_height, is_primary, sort_order, created_at
        FROM images 
        WHERE listing_id = p_listing_id 
        ORDER BY sort_order ASC, created_at ASC;
      END;
    `);
    
    console.log('✅ get_listing_images procedure created successfully');
    
    console.log('🎉 Images table setup completed successfully!');
    
  } catch (err) {
    console.error('❌ Error creating images table:', err);
    throw err;
  }
}

// Run if called directly
if (require.main === module) {
  createImagesTable()
    .then(() => {
      console.log('Images table creation completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Images table creation failed:', err);
      process.exit(1);
    });
}

module.exports = createImagesTable;
