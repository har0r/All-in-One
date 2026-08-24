// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

// This file is also handled via events/verification.js but we keep a handler here for modular routing via interactionCreate
const verificationHandler = require('../../events/verification');

module.exports = {
  async execute(interaction, client) {
    // delegate to verification event handler
    return verificationHandler.execute(interaction, client);
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
