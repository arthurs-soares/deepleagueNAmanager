# Discord Components v2 Guide

This guide documents how Guild Manager uses Discord Components v2 to build rich, accessible UI without legacy embeds. It includes API references, examples, migration tips, and integration patterns.

## APIs Used

### ContainerBuilder
- Purpose: Top-level container for text and interactive components
- Key methods:
  - `setAccentColor(number color)` – Sets the left accent bar color
  - `addTextDisplayComponents(...TextDisplayBuilder[])` – Add text blocks
  - `addSectionComponents(...SectionBuilder[])` – Add layout sections (optional)

### SectionBuilder
- Purpose: Group related UI in a structured section (optional)
- Key methods:
  - `addTextDisplayComponents(...TextDisplayBuilder[])`
  - `addSeparator(SeparatorBuilder)` – Visual divider inside a section
- **IMPORTANT LIMIT**: A SectionBuilder can contain a maximum of **3 components** (TextDisplayBuilder or other components). Exceeding this limit will cause an `ExpectedConstraintError`.

### TextDisplayBuilder
- Purpose: Render text with Markdown
- Key methods:
  - `setContent(string)` – Sets raw Markdown content
- **IMPORTANT**: Content must be non-empty. Empty strings will cause validation errors.

### SeparatorBuilder
- Purpose: Visual divider between logical areas
- Typical usage: `new SeparatorBuilder()` and add to SectionBuilder

Note: Builders are imported from `@discordjs/builders` and are render-only; send them via `interaction.reply/editReply/followUp` with `MessageFlags.IsComponentsV2` (our reply utilities auto-detect and add this when possible).

## Working Examples

### Success container
```js
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const container = new ContainerBuilder();
container
  .addTextDisplayComponents(
    new TextDisplayBuilder().setContent('# ✅ Operation complete'),
    new TextDisplayBuilder().setContent('Everything worked as expected.')
  )
  .setAccentColor(0x00ff00);
await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
```

### Error response via helper
```js
const { createErrorEmbed } = require('../utils/embeds/embedBuilder');
const { replyEphemeral } = require('../utils/core/reply');
await replyEphemeral(interaction, { components: [createErrorEmbed('Error', 'Something failed.')] });
```

### Detail + action row
```js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { buildGuildDetailDisplayComponents } = require('../utils/embeds/guildDetailEmbed');
const container = await buildGuildDetailDisplayComponents(guild, interaction.guild);
const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId('viewGuild:history:' + guild._id).setLabel('📊 History').setStyle(ButtonStyle.Primary)
);
await interaction.editReply({ components: [container, row], flags: MessageFlags.IsComponentsV2 });
```

## Migration from Traditional Embeds

- Replace `EmbedBuilder` with Components v2 builders
- Map fields to TextDisplay blocks (prefer semantic headings and paragraphs)
- Accent color → `ContainerBuilder#setAccentColor`
- For multi-column/complex layouts, create multiple sections with `SectionBuilder`
- All user-facing text should be English and use concise headings

Migration snippet:
```js
// Old
await interaction.editReply({ embeds: [embed] });

// New
await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
```

## Best Practices (Layout, Styling, Accessibility)
- Use clear headings (e.g., `# Title`) for screen-reader friendly navigation
- Keep lines under ~80 chars when feasible; break long sentences into paragraphs
- Prefer early returns and concise messages
- Use color meaningfully: success/info/warning/error from config colors
- Don’t mix legacy embeds and Components v2 in the same message
- Keep containers focused: one primary action or topic per message

## Common Pitfalls & Troubleshooting
- Error `ExpectedConstraintError > s.array(T).lengthLessThanOrEqual()` with "expected.length <= 3":
  - **Cause**: A SectionBuilder has more than 3 components added to it
  - **Solution**: Either combine multiple lines into a single TextDisplayBuilder using `\n` to join them, or split content across multiple sections
  - **Example Fix**:
    ```js
    // ❌ BAD - Creates 6 TextDisplayBuilder components in one section
    const section = new SectionBuilder();
    for (const line of lines) {
      section.addTextDisplayComponents(new TextDisplayBuilder().setContent(line));
    }

    // ✅ GOOD - Combines all lines into one TextDisplayBuilder
    const section = new SectionBuilder();
    const content = lines.filter(line => line && line.trim().length > 0).join('\n');
    if (content && content.trim().length > 0) {
      section.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
      container.addSectionComponents(section);
    }
    ```
- Error `ExpectedValidationError > s.instance(V)` expecting ButtonBuilder or ThumbnailBuilder but receiving undefined:
  - **Cause**: A SectionBuilder or TextDisplayBuilder was created with empty/invalid content
  - **Solution**: Always validate that content is non-empty before creating TextDisplayBuilder components
  - **Example Fix**:
    ```js
    // ❌ BAD - Could create TextDisplayBuilder with empty string
    const content = lines.join('\n');
    section.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

    // ✅ GOOD - Validates content before creating component
    const content = lines.filter(line => line && line.trim().length > 0).join('\n');
    if (content && content.trim().length > 0) {
      section.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
    }
    ```
- Error `COMPONENT_LAYOUT_WIDTH_EXCEEDED` (50035):
  - Reduce content width; split into multiple containers/messages
  - Avoid extremely long unbroken text or tables
- Interaction already acknowledged (40060):
  - Use `replyEphemeral()` and `safeDeferEphemeral()` helpers to avoid double-acks
- Unknown interaction (10062):
  - The token expired; never try to respond again; log and return
- Missing `MessageFlags.IsComponentsV2`:
  - Use `replyEphemeral()` which auto-detects v2 components and adds flags; or add the flag manually

## Integration with Guild Manager Utilities

- `src/utils/embeds/embedBuilder.js`
  - `createSuccessEmbed(title, description)`
  - `createErrorEmbed(title, description)`
  - `createWarningEmbed(title, description)`
  - `createInfoEmbed(title, description)`
  - These return `ContainerBuilder` instances ready to send

- `src/utils/core/reply.js`
  - `replyEphemeral(interaction, options)` auto-adds `MessageFlags.Ephemeral` and `IsComponentsV2` when appropriate, and chooses reply/editReply/followUp safely

- `src/utils/core/ack.js`
  - `safeDeferEphemeral(interaction)` defers replies safely, catching common error codes

- `src/core/errors/interactionErrorHandler.js`
  - Centralized error containers and ephemeral replies for interaction errors

## Patterns to Follow
- Build containers using the helper functions in embedBuilder.js for consistency
- For long operations, call `safeDeferEphemeral()` first, then `editReply`
- On errors, always use ephemeral replies; do not leak sensitive details
- Use routing utilities to keep handlers small and under our line limits

## Example Command Skeleton
```js
const { SlashCommandBuilder } = require('discord.js');
const { replyEphemeral } = require('../utils/core/reply');
const { createSuccessEmbed, createErrorEmbed } = require('../utils/embeds/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder().setName('example').setDescription('Example command'),
  cooldown: 3,
  async execute(interaction) {
    try {
      const ok = true;
      if (!ok) return replyEphemeral(interaction, { components: [createErrorEmbed('Oops', 'Try again later.')] });
      await interaction.reply({ components: [createSuccessEmbed('Done', 'All set!')], flags: MessageFlags.IsComponentsV2 });
    } catch (e) {
      await replyEphemeral(interaction, { components: [createErrorEmbed('Error', 'Unexpected failure.')] });
    }
  }
};
```

---

Keep this document updated whenever we add new Components v2 features or patterns.

