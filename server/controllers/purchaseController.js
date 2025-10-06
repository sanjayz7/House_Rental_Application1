const oracledb = require('oracledb');
const dbConfig = require('../config/dbConfig');

// Add a new purchase (free house purchase)
const addPurchase = async (req, res) => {
  let connection;
  
  try {
    const { listingId, notes } = req.body;
    const buyerId = req.user.userId;
    
    if (!listingId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Listing ID is required' 
      });
    }

    connection = await oracledb.getConnection(dbConfig);

    // First, get the listing details to get the seller ID
    const listingQuery = `
      SELECT owner_id, title, available_units 
      FROM listings 
      WHERE listing_id = :listingId
    `;
    
    const listingResult = await connection.execute(listingQuery, [listingId]);
    
    if (listingResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Listing not found' 
      });
    }

    const listing = listingResult.rows[0];
    const sellerId = listing[0];
    const title = listing[1];
    const availableUnits = listing[2];

    // Check if the listing is available
    if (availableUnits <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'This property is no longer available' 
      });
    }

    // Check if user is trying to buy their own property
    if (buyerId === sellerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot purchase your own property' 
      });
    }

    // Add the purchase
    const addPurchaseQuery = `
      BEGIN
        add_purchase(:listingId, :buyerId, :sellerId, :notes, :purchaseId);
      END;
    `;

    const result = await connection.execute(addPurchaseQuery, {
      listingId: listingId,
      buyerId: buyerId,
      sellerId: sellerId,
      notes: notes || null,
      purchaseId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    });

    const purchaseId = result.outBinds.purchaseId;

    // Update available units (decrease by 1)
    const updateUnitsQuery = `
      UPDATE listings 
      SET available_units = available_units - 1, updated_at = SYSTIMESTAMP
      WHERE listing_id = :listingId
    `;
    
    await connection.execute(updateUnitsQuery, [listingId]);

    res.json({
      success: true,
      message: `Congratulations! You have successfully purchased "${title}" for free!`,
      purchaseId: purchaseId,
      data: {
        listingId,
        purchaseId,
        purchaseDate: new Date().toISOString(),
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('Error adding purchase:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing purchase',
      error: error.message 
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
  }
};

// Get user's purchases
const getUserPurchases = async (req, res) => {
  let connection;
  
  try {
    const userId = req.user.userId;
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `BEGIN get_user_purchases(:userId, :cursor); END;`,
      {
        userId: userId,
        cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
      }
    );

    const cursor = result.outBinds.cursor;
    const purchases = await cursor.getRows();

    await cursor.close();

    res.json({
      success: true,
      data: purchases.map(purchase => ({
        purchaseId: purchase[0],
        purchaseDate: purchase[1],
        status: purchase[2],
        notes: purchase[3],
        property: {
          title: purchase[4],
          description: purchase[5],
          address: purchase[6],
          imageUrl: purchase[7],
          bedrooms: purchase[8],
          bathrooms: purchase[9],
          areaSqft: purchase[10],
          furnished: purchase[11],
          price: purchase[12],
          city: purchase[13]
        },
        seller: {
          name: purchase[14],
          email: purchase[15],
          phone: purchase[16]
        }
      }))
    });

  } catch (error) {
    console.error('Error getting user purchases:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching purchases',
      error: error.message 
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
  }
};

// Get seller's sales
const getSellerSales = async (req, res) => {
  let connection;
  
  try {
    const sellerId = req.user.userId;
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `BEGIN get_seller_sales(:sellerId, :cursor); END;`,
      {
        sellerId: sellerId,
        cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
      }
    );

    const cursor = result.outBinds.cursor;
    const sales = await cursor.getRows();

    await cursor.close();

    res.json({
      success: true,
      data: sales.map(sale => ({
        purchaseId: sale[0],
        purchaseDate: sale[1],
        status: sale[2],
        notes: sale[3],
        property: {
          title: sale[4],
          description: sale[5],
          address: sale[6],
          imageUrl: sale[7],
          bedrooms: sale[8],
          bathrooms: sale[9],
          areaSqft: sale[10],
          furnished: sale[11],
          price: sale[12],
          city: sale[13]
        },
        buyer: {
          name: sale[14],
          email: sale[15]
        }
      }))
    });

  } catch (error) {
    console.error('Error getting seller sales:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching sales',
      error: error.message 
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
  }
};

// Get purchase statistics
const getPurchaseStats = async (req, res) => {
  let connection;
  
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    connection = await oracledb.getConnection(dbConfig);

    let statsQuery;
    let params;

    if (userRole === 'user') {
      // Get purchase stats for regular users
      statsQuery = `
        SELECT 
          COUNT(*) as total_purchases,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_purchases,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_purchases,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_purchases
        FROM purchases 
        WHERE buyer_id = :userId
      `;
      params = { userId: userId };
    } else if (userRole === 'owner') {
      // Get sales stats for house owners
      statsQuery = `
        SELECT 
          COUNT(*) as total_sales,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sales,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_sales,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_sales
        FROM purchases 
        WHERE seller_id = :userId
      `;
      params = { userId: userId };
    } else {
      // Get overall stats for admins
      statsQuery = `
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_transactions
        FROM purchases
      `;
      params = {};
    }

    const result = await connection.execute(statsQuery, params);
    const stats = result.rows[0];

    res.json({
      success: true,
      data: {
        total: parseInt(stats[0]),
        completed: parseInt(stats[1]),
        pending: parseInt(stats[2]),
        cancelled: parseInt(stats[3])
      }
    });

  } catch (error) {
    console.error('Error getting purchase stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching purchase statistics',
      error: error.message 
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
  }
};

module.exports = {
  addPurchase,
  getUserPurchases,
  getSellerSales,
  getPurchaseStats
};

