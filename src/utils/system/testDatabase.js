require('dotenv').config();
const mongoose = require('mongoose');
const LoggerService = require('../../services/LoggerService');

/**
 * Test MongoDB connection
 */
async function testDatabaseConnection() {
  try {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      LoggerService.error('DATABASE_URL is not defined in .env file');
      return false;
    }

    LoggerService.info('Testing MongoDB connection...');
    LoggerService.info('Connection URL:', {
      url: connectionString.replace(/\/\/.*:.*@/, '//***:***@')
    });

    const connectionOptions = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    };

    await mongoose.connect(connectionString, connectionOptions);

    LoggerService.info('MongoDB connection established successfully!');
    LoggerService.info('Connection details:', {
      state: mongoose.connection.readyState,
      database: mongoose.connection.name || 'Default',
      host: mongoose.connection.host
    });

    const collections = await mongoose.connection.db
      .listCollections().toArray();
    LoggerService.info('Available collections:', { count: collections.length });

    await mongoose.disconnect();
    LoggerService.info('Disconnected successfully');

    return true;
  } catch (error) {
    LoggerService.error('Error connecting to MongoDB:', {
      error: error.message
    });

    if (error.name === 'MongoServerError') {
      if (error.code === 8000) {
        LoggerService.error('Authentication problem:', {
          hints: [
            'Check if username and password are correct',
            'Verify user has permissions on the database'
          ]
        });
      }
    } else if (error.name === 'MongoNetworkError') {
      LoggerService.error('Network problem:', {
        hints: [
          'Check your internet connection',
          'Verify IP is whitelisted in MongoDB Atlas'
        ]
      });
    } else if (error.name === 'MongooseServerSelectionError') {
      LoggerService.error('Server selection timeout:', {
        hints: [
          'Cluster may be inactive or unreachable',
          'Verify connection URL'
        ]
      });
    }

    return false;
  }
}

/**
 * Run test if file is called directly
 */
async function main() {
  try {
    const success = await testDatabaseConnection();
    process.exit(success ? 0 : 1);
  } catch (error) {
    LoggerService.error('Unexpected error:', { error: error?.message });
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testDatabaseConnection };
