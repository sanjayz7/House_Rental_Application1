# 🧪 Testing Browse Listings Functionality

This guide will help you test the "Browse Listings" feature of the House Rental Finder application.

## 🔍 **Current Status Check**

### 1. **Database Connection Test**
```bash
cd server
node testConnection.js
```

This will show:
- ✅ Database connection status
- 📋 Available tables
- 📊 Data count in listings table
- 📝 Sample data (if any exists)

### 2. **Expected Output**
If everything is working, you should see:
```
✅ Basic connection test passed: { TEST: 1 }
✅ LISTINGS table exists
📋 LISTINGS table structure:
  - LISTING_ID: NUMBER (not null)
  - OWNER_ID: NUMBER (not null)
  - TITLE: VARCHAR2 (not null)
  - PRICE: NUMBER (not null)
  - ADDRESS: VARCHAR2 (nullable)
  ... (more columns)
📊 Total listings: X
📝 Sample listings:
  1. Cozy 2-Bedroom Apartment - $1800
  2. Spacious 3-Bedroom House - $2800
  3. Modern Studio Loft - $2200
```

## 🚀 **Testing Steps**

### **Step 1: Start the Backend**
```bash
cd server
npm start
```

### **Step 2: Start the Frontend**
```bash
cd client
npm start
```

### **Step 3: Navigate to Browse Listings**
1. Open browser to `http://localhost:3000`
2. Click "Browse Listings" in the navbar
3. Or go directly to `http://localhost:3000/listings`

### **Step 4: Expected Behavior**
- **Loading State**: Should show "Loading listings..."
- **Data Display**: Should show property cards with:
  - Property images
  - Titles and descriptions
  - Prices and addresses
  - Bedroom/bathroom counts
  - Verification badges
- **Filters**: Should work for search, price, category, etc.
- **Pagination**: If more than 6 listings exist

## 🐛 **Troubleshooting**

### **Issue 1: "No listings found"**
**Cause**: Database table is empty or doesn't exist
**Solution**: 
```bash
cd server
node seedData.js
```

### **Issue 2: "Failed to fetch listings"**
**Cause**: Backend server not running or database connection failed
**Solution**:
1. Check if server is running on port 5000
2. Verify database connection in `.env` file
3. Check server console for error messages

### **Issue 3: Empty page with no error**
**Cause**: API returning empty array or wrong data structure
**Solution**:
1. Check browser Network tab for API response
2. Verify `/api/listings` endpoint returns data
3. Check server logs for errors

### **Issue 4: Field names don't match**
**Cause**: Database schema vs. frontend expectations mismatch
**Solution**: 
1. Run `node testConnection.js` to see actual schema
2. Update frontend field mapping if needed

## 📊 **API Endpoints to Test**

### **GET /api/listings**
- **Expected**: Array of listing objects
- **Test**: `curl http://localhost:5000/api/listings`

### **GET /api/listings/search?q=apartment**
- **Expected**: Filtered results
- **Test**: `curl "http://localhost:5000/api/listings/search?q=apartment"`

## 🔧 **Quick Fixes**

### **If listings table doesn't exist:**
```sql
-- Run the schema.sql file in your Oracle database
@database/schema.sql
```

### **If no data exists:**
```bash
cd server
node seedData.js
```

### **If server won't start:**
```bash
cd server
npm install
# Check .env file exists with database credentials
npm start
```

## ✅ **Success Criteria**

The Browse Listings page is working correctly when:
1. ✅ Page loads without errors
2. ✅ Property cards display correctly
3. ✅ Search and filters work
4. ✅ Pagination works (if needed)
5. ✅ Images load properly
6. ✅ Role-based actions work (Edit/Delete for owners)
7. ✅ Favorites functionality works for users

## 📞 **Need Help?**

If you're still having issues:
1. Check the server console for error messages
2. Verify database connection details
3. Ensure all dependencies are installed
4. Check if Oracle database is accessible

---

**Happy Testing! 🎉**
