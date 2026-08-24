// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize
} = require('discord.js');
const config = require('../config.json');
const db = require('../utils/db');
const builders = require('../utils/builders');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Handle Slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        const c = new ContainerBuilder().setAccentColor(0xED4245)
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.error} Unknown Command\nThis command is not registered.`))
          .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
        return interaction.reply({ components: [c], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(() => {});
      }
      try {
        // Only defer if not already deferred and command expects it
        await command.execute(interaction, client);
      } catch (err) {
        console.error(`[SLASH ERROR] ${interaction.commandName}:`, err);
        const errContainer = builders.buildErrorContainer('Execution Error', `\`\`\`${String(err.message).slice(0, 1500)}\`\`\``);
        const payload = { components: [errContainer], flags: builders.replyFlags(true) };
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(payload).catch(() => {});
        } else {
          await interaction.reply(payload).catch(() => {});
        }
      }
      return;
    }

    // Handle Buttons
    if (interaction.isButton()) {
      const id = interaction.customId;

      // Try to find button handler in src/components/buttons
      try {
        const handlerPath = `../components/buttons/${id.split(':')[0].split('_')[0]}`;
        // Map known ids
        const map = {
          verify: '../components/buttons/verify',
          embed: '../components/buttons/embed',
          selfroles: '../components/buttons/selfroles',
          poll: '../components/buttons/poll',
          giveaway: '../components/buttons/giveaway',
          suggestion_accept: '../components/buttons/suggestion',
          suggestion_reject: '../components/buttons/suggestion',
          suggestion: '../components/buttons/suggestion',
          feedback_accept: '../components/buttons/feedback',
          feedback_reject: '../components/buttons/feedback',
          feedback: '../components/buttons/feedback',
          deleteall_confirm: '../components/buttons/deleteall',
          deleteall_cancel: '../components/buttons/deleteall',
          ticket_create: '../components/buttons/ticket',
          ticket: '../components/buttons/ticket',
        };
        // Try direct id
        let handler = null;
        // Try exact customId file
        try {
          if (map[id]) handler = require(map[id]);
          else if (map[id.split(':')[0]]) handler = require(map[id.split(':')[0]]);
          else if (id.startsWith('verify')) handler = require('../components/buttons/verify');
          else if (id.startsWith('embed')) handler = require('../components/buttons/embed');
          else if (id.startsWith('selfroles')) handler = require('../components/buttons/selfroles');
          else if (id.startsWith('poll')) handler = require('../components/buttons/poll');
          else if (id.startsWith('giveaway')) handler = require('../components/buttons/giveaway');
          else if (id.startsWith('suggestion')) handler = require('../components/buttons/suggestion');
          else if (id.startsWith('feedback')) handler = require('../components/buttons/feedback');
          else if (id.startsWith('deleteall')) handler = require('../components/buttons/deleteall');
          else if (id.startsWith('ticket')) handler = require('../components/buttons/ticket');
        } catch (_) {}

        if (handler && typeof handler.execute === 'function') {
          return await handler.execute(interaction, client);
        }

        // Fallback: try dynamic require by prefix before _
        const prefix = id.split('_')[0].split(':')[0];
        try {
          const dyn = require(`../components/buttons/${prefix}`);
          if (dyn && dyn.execute) return await dyn.execute(interaction, client);
        } catch (_) {}
      } catch (e) {
        console.error(`[BUTTON ERROR] ${id}:`, e);
      }

      // If not handled, try generic verification/logging fallback (handled in verification.js secondary listener)
      return;
    }

    // Handle Modals
    if (interaction.isModalSubmit()) {
      const id = interaction.customId;
      try {
        let handler = null;
        if (id.startsWith('embed_modal') || id.startsWith('embed_edit')) handler = require('../components/modals/embed');
        else if (id.startsWith('announce_modal')) handler = require('../components/modals/announce');
        else if (id.startsWith('selfroles_modal')) handler = require('../components/modals/selfroles');
        else if (id.startsWith('ticket_modal')) {
          try { handler = require('../components/modals/ticket'); } catch {}
        }
        // generic
        if (!handler) {
          const prefix = id.split('_')[0].split(':')[0];
          try { handler = require(`../components/modals/${prefix}`); } catch {}
        }
        if (handler && handler.execute) return await handler.execute(interaction, client);
      } catch (e) {
        console.error(`[MODAL ERROR] ${id}:`, e);
        const err = builders.buildErrorContainer('Modal Error', `\`\`\`${e.message.slice(0, 1000)}\`\`\``);
        if (interaction.deferred || interaction.replied) await interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
        else await interaction.reply({ components: [err], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
      }
      return;
    }

    // Handle Select Menus (String, Role, Channel, User)
    if (interaction.isAnySelectMenu()) {
      const id = interaction.customId;
      try {
        let handler = null;
        if (id.startsWith('embed_select') || id.startsWith('embed:')) handler = require('../components/selectMenus/embed');
        else if (id.startsWith('selfroles_select') || id.startsWith('selfroles:')) handler = require('../components/selectMenus/selfroles');
        else {
          const prefix = id.split('_')[0].split(':')[0];
          try { handler = require(`../components/selectMenus/${prefix}`); } catch {}
        }
        if (handler && handler.execute) return await handler.execute(interaction, client);
      } catch (e) {
        console.error(`[SELECT ERROR] ${id}:`, e);
      }
      return;
    }

    // Autocomplete
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command && command.autocomplete) {
        try { await command.autocomplete(interaction, client); } catch {}
      }
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
