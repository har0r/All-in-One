// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const builders = require('../../utils/builders');
const { takePending } = require('../modals/broadcast');

module.exports = {
  async execute(interaction, client) {
    const raw = interaction.customId;

    if (raw.startsWith('broadcast_cancel_')) {
      takePending(raw.replace('broadcast_cancel_', ''));
      const c = new ContainerBuilder().setAccentColor(0x2B2D31)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Broadcast cancelled. Nothing was sent.`));
      return interaction.update({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }

    if (raw.startsWith('broadcast_confirm_')) {
      const key = raw.replace('broadcast_confirm_', '');
      if (!key.startsWith(`${interaction.user.id}_`)) {
        const c = new ContainerBuilder().setAccentColor(0xED4245)
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Only the member who started this broadcast can confirm it.`));
        return interaction.reply({ components: [c], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      const entry = takePending(key);
      if (!entry) {
        const c = new ContainerBuilder().setAccentColor(0xED4245)
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(`This confirmation expired. Run \`/broadcast\` again.`));
        return interaction.update({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }

      const started = new ContainerBuilder().setAccentColor(0x5865F2)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Broadcast Running\nSending to \`${entry.members.length}\` members... This message updates when finished.`));
      await interaction.update({ components: [started], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});

      let sent = 0, failed = 0;
      for (const member of entry.members) {
        try {
          const dm = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(entry.content))
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${interaction.guild.name} • ${builders.BRAND_FOOTER}`));
          await member.send({ components: [dm], flags: MessageFlags.IsComponentsV2 });
          sent++;
        } catch {
          failed++;
        }
        await new Promise(r => setTimeout(r, 1200));
      }

      const done = new ContainerBuilder().setAccentColor(0x57F287)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Broadcast Finished\n**Delivered:** \`${sent}\`\n**Failed / DMs closed:** \`${failed}\``))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Target: ${entry.target} • ${interaction.guild.name}`));
      await interaction.editReply({ components: [done] }).catch(()=>{});
    }
  }
};
// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
