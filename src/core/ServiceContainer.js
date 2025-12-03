/**
 * Service Container for managing dependencies
 * Replaces global variables with controlled dependency injection
 */
class ServiceContainer {
  constructor() {
    this.services = new Map();
  }

  /**
   * Register a service
   * @param {string} name - Service name
   * @param {any} service - Service instance
   */
  register(name, service) {
    this.services.set(name, service);
  }

  /**
   * Get a service
   * @param {string} name - Service name
   * @returns {any} Service instance
   */
  get(name) {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found in container`);
    }
    return service;
  }

  /**
   * Check if service exists
   * @param {string} name - Service name
   * @returns {boolean}
   */
  has(name) {
    return this.services.has(name);
  }

  /**
   * Remove a service
   * @param {string} name - Service name
   */
  unregister(name) {
    this.services.delete(name);
  }

  /**
   * Clear all services
   */
  clear() {
    this.services.clear();
  }
}

// Export singleton instance
module.exports = new ServiceContainer();
