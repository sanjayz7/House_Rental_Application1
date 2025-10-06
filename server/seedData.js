const db = require('./db/oracleConnection');

const sampleListings = [
  {
    title: 'Cozy 2-Bedroom Apartment',
    description: 'Beautiful apartment in a quiet neighborhood with modern amenities',
    image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500',
    address: '123 Main Street, Downtown',
    latitude: 40.7128,
    longitude: -74.0060,
    owner_phone: '+1-555-0123',
    price: 1800,
    bedrooms: 2,
    bathrooms: 1,
    area_sqft: 850,
    furnished: 'Furnished',
    verified: 1,
    deposit: 1800,
    total_units: 1,
    available_units: 1,
    category: 'Apartment',
    city: 'New York'
  },
  {
    title: 'Spacious 3-Bedroom House',
    description: 'Large family home with backyard and garage',
    image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500',
    address: '456 Oak Avenue, Suburbs',
    latitude: 40.7589,
    longitude: -73.9851,
    owner_phone: '+1-555-0456',
    price: 2800,
    bedrooms: 3,
    bathrooms: 2,
    area_sqft: 1200,
    furnished: 'Semi-Furnished',
    verified: 1,
    deposit: 2800,
    total_units: 1,
    available_units: 1,
    category: 'House',
    city: 'New York'
  },
  {
    title: 'Modern Studio Loft',
    description: 'Contemporary loft with high ceilings and city views',
    image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500',
    address: '789 Park Lane, Midtown',
    latitude: 40.7505,
    longitude: -73.9934,
    owner_phone: '+1-555-0789',
    price: 2200,
    bedrooms: 0,
    bathrooms: 1,
    area_sqft: 600,
    furnished: 'Furnished',
    verified: 0,
    deposit: 2200,
    total_units: 1,
    available_units: 1,
    category: 'Studio',
    city: 'New York'
  }
];

async function seedListings() {
  try {
    console.log('Starting to seed listings...');
    
    for (const listing of sampleListings) {
      const result = await db.execute(
        `BEGIN add_listing(
          :owner_id,:title,:description,:image_url,:address,:latitude,:longitude,
          :owner_phone,:bedrooms,:bathrooms,:area_sqft,:furnished,:verified,:deposit,
          :available_from,:contact_start,:contact_end,:price,:total_units,:available_units,
          :city,:category,:listing_id); END;`,
        {
          owner_id: 1, // Assuming admin user ID 1 exists
          title: listing.title,
          description: listing.description,
          image_url: listing.image_url,
          address: listing.address,
          latitude: listing.latitude,
          longitude: listing.longitude,
          owner_phone: listing.owner_phone,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          area_sqft: listing.area_sqft,
          furnished: listing.furnished,
          verified: listing.verified,
          deposit: listing.deposit,
          available_from: new Date(),
          contact_start: null,
          contact_end: null,
          price: listing.price,
          total_units: listing.total_units,
          available_units: listing.available_units,
          city: listing.city,
          category: listing.category,
          listing_id: { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER }
        }
      );
      
      const listingId = result.outBinds.listing_id[0];
      console.log(`Created listing: ${listing.title} with ID: ${listingId}`);
    }
    
    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error seeding listings:', error);
  } finally {
    await db.closePool();
    process.exit(0);
  }
}

// Run the seed function
seedListings();
