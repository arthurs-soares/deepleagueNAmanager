// Database connection error diagnostics

/**
 * Provide detailed error diagnostics
 * @param {Error} error
 */
function provideDiagnostics(error) {
  if (error.name === 'MongoServerError') {
    if (error.code === 8000) {
      console.error('🔐 Authentication Error: Check your MongoDB credentials');
      console.error('   - Are username and password correct in DATABASE_URL?');
      console.error('   - Does the user have permissions on the database?');
    }
  } else if (error.name === 'MongoNetworkError') {
    console.error('🌐 Network Error: Check your internet connection');
    console.error('   - Is your IP whitelisted in MongoDB Atlas?');
    console.error('   - Try adding 0.0.0.0/0 temporarily for testing');
  }
}

module.exports = {
  provideDiagnostics
};
