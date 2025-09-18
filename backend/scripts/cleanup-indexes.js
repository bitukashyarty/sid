const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the students collection
    const db = mongoose.connection.db;
    const studentsCollection = db.collection('students');

    // List all indexes
    console.log('Current indexes on students collection:');
    const indexes = await studentsCollection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Drop the problematic indexes if they exist
    const indexesToDrop = ['studentId_1', 'email_1'];
    
    for (const indexName of indexesToDrop) {
      try {
        await studentsCollection.dropIndex(indexName);
        console.log(`Dropped ${indexName} index successfully`);
      } catch (error) {
        if (error.code === 27) {
          console.log(`${indexName} index does not exist, skipping...`);
        } else {
          console.log(`Error dropping ${indexName} index:`, error.message);
        }
      }
    }

    // Recreate the proper indexes
    await studentsCollection.createIndex({ class: 1, section: 1 });
    console.log('Recreated class and section compound index');

    console.log('Index cleanup completed successfully');
    
  } catch (error) {
    console.error('Error during index cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

cleanupIndexes();