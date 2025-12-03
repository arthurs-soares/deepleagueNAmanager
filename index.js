require('dotenv').config();
const LoggerService = require('./src/services/LoggerService');
LoggerService.info('Loading dependencies...');
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const serviceContainer = require('./src/core/ServiceContainer');
const RateLimitService = require('./src/core/RateLimitService');
const { initializeBot } = require('./src/core/bootstrap');
const { gracefulShutdown } = require('./src/core/shutdown');
LoggerService.info('Dependencies loaded!');

// Create client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Channel, Partials.User]
});

// Register client in service container (controlled access)
serviceContainer.register('discordClient', client);

// Register rate limiting service
const rateLimitService = new RateLimitService();
serviceContainer.register('rateLimitService', rateLimitService);

// Initialize collections
client.commands = new Collection();

// Handle unhandled rejections
process.on('unhandledRejection', error => {
  LoggerService.error('Unhandled promise rejection:', { error: error?.message });
});

process.on('uncaughtException', error => {
  LoggerService.error('Uncaught exception:', { error: error?.message });
  gracefulShutdown(client, 1);
});

// Graceful shutdown handlers
process.on('SIGINT', () => {
  LoggerService.info('Received SIGINT. Shutting down gracefully...');
  gracefulShutdown(client, 0);
});

process.on('SIGTERM', () => {
  LoggerService.info('Received SIGTERM. Shutting down gracefully...');
  gracefulShutdown(client, 0);
});

initializeBot(client);
