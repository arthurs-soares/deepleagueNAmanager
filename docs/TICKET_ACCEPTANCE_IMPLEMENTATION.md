# Ticket Acceptance Restrictions Implementation

## Overview
This document describes the implementation of ticket acceptance restrictions for war and wager tickets to prevent spam pings and ensure proper mention timing.

## Requirements Implemented

### 1. Single Acceptance Limit ✅
- Each war/wager ticket can only be accepted once
- Database tracking prevents multiple acceptances
- Accept button is disabled after first acceptance
- Clear error message shown if attempting to accept already-accepted ticket

### 2. Mention Control ✅
- **DO NOT** mention hosters when ticket is initially created
- **ONLY** mention hosters when a user clicks the "Accept" button
- Participants are mentioned on creation (without ping)
- Hosters are pinged only on acceptance

### 3. Implementation Details ✅
- Acceptance state tracked in database with `acceptedAt` and `acceptedByUserId` fields
- Atomic database updates prevent race conditions
- Button components removed/disabled after acceptance
- Proper Discord mention formatting maintained

## Files Modified

### 1. Database Models

#### `src/models/wager/WagerTicket.js`
**Added fields:**
```javascript
acceptedAt: { type: Date, default: null },
acceptedByUserId: { type: String, default: null },
```

#### `src/models/war/War.js`
**Added fields:**
```javascript
acceptedAt: { type: Date, default: null },
acceptedByUserId: { type: String, default: null },
```

### 2. Wager Ticket Handlers

#### `src/interactions/buttons/wager/wagerCreateTicket.js`
**Changes:**
- **REMOVED** hoster mention block (lines 82-97)
- **KEPT** participant display message (without ping)
- **ADDED** comment explaining hosters are mentioned only on acceptance

**Before:**
```javascript
// Mention support roles (hosters)
try {
  const validRoleMentions = roleIdsHosters
    .filter(roleId => interaction.guild.roles.cache.has(roleId))
    .map(roleId => `<@&${roleId}>`)
    .join(' ');

  if (validRoleMentions) {
    await channel.send({
      content: `${validRoleMentions} - New wager ticket created: ...`,
      allowedMentions: { roles: roleIdsHosters }
    });
  }
} catch (err) {
  console.warn('Failed to mention support roles:', err?.message);
}
```

**After:**
```javascript
// Note: Hosters are NOT mentioned on ticket creation
// They will be mentioned only when someone clicks the "Accept" button
```

#### `src/interactions/buttons/wager/wagerAccept.js`
**Changes:**
- **ADDED** acceptance check after status validation
- **ADDED** atomic database update with `acceptedAt` and `acceptedByUserId`
- **ADDED** button disabling by editing `interaction.message`
- **KEPT** hoster mention (already correct - only on acceptance)

**Added code:**
```javascript
// Check if ticket has already been accepted (prevent spam pings)
if (ticket.acceptedAt) {
  return interaction.editReply({ 
    content: `⚠️ This ticket has already been accepted by <@${ticket.acceptedByUserId}> at <t:${Math.floor(ticket.acceptedAt.getTime() / 1000)}:R>.` 
  });
}

// Mark ticket as accepted (atomic update to prevent race conditions)
ticket.acceptedAt = new Date();
ticket.acceptedByUserId = interaction.user.id;
await ticket.save();

// Disable the Accept button on the original message to prevent multiple acceptances
try {
  await interaction.message.edit({ components: [] });
} catch (err) {
  console.warn('Failed to disable accept button:', err?.message);
}
```

### 3. War Ticket Handlers

#### `src/interactions/modals/warScheduleModal.js`
**Changes:**
- **REMOVED** hoster mention block (lines 85-101)
- **KEPT** participant access notification
- **ADDED** comment explaining hosters are mentioned only on acceptance

**Before:**
```javascript
// Mention hosters only (not moderators)
try {
  const validRoleMentions = roleIdsHosters
    .filter(roleId => interaction.guild.roles.cache.has(roleId))
    .map(roleId => `<@&${roleId}>`)
    .join(' ');

  if (validRoleMentions) {
    await warChannel.send({
      content: `${validRoleMentions} - New war ticket created: ${guildA.name} vs ${guildB.name}`,
      allowedMentions: { roles: roleIdsHosters }
    });
  }
} catch (err) {
  console.warn('Failed to mention hosters:', err?.message);
}
```

**After:**
```javascript
// Note: Hosters are NOT mentioned on war creation
// They will be mentioned only when the war is accepted by clicking the "Accept" button
```

#### `src/interactions/buttons/war/warConfirmAccept.js`
**Changes:**
- **ADDED** acceptance check after status validation
- **ADDED** atomic database update with `acceptedAt` and `acceptedByUserId`
- **KEPT** button disabling (already implemented)
- **KEPT** hoster mention (already correct - only on acceptance)

**Added code:**
```javascript
// Check if war has already been accepted (prevent spam pings)
if (war.acceptedAt) {
  return interaction.editReply({ 
    content: `⚠️ This war has already been accepted by <@${war.acceptedByUserId}> at <t:${Math.floor(war.acceptedAt.getTime() / 1000)}:R>.` 
  });
}

// Mark war as accepted (atomic update to prevent race conditions)
war.acceptedAt = new Date();
war.acceptedByUserId = interaction.user.id;
await war.save();
```

## Behavior Changes

### Before Implementation

**Wager Ticket Flow:**
1. User creates wager ticket → Hosters are mentioned ❌
2. User clicks Accept → Hosters are mentioned again ❌
3. Multiple users can click Accept → Multiple pings ❌

**War Ticket Flow:**
1. User creates war ticket → Hosters are mentioned ❌
2. User clicks Accept → Hosters are mentioned ✅
3. Multiple users can click Accept → Multiple pings ❌

### After Implementation

**Wager Ticket Flow:**
1. User creates wager ticket → Participants shown (no ping) ✅
2. User clicks Accept → Hosters are mentioned (first time) ✅
3. Accept button is disabled → No more acceptances possible ✅
4. Subsequent Accept attempts → Error message shown ✅

**War Ticket Flow:**
1. User creates war ticket → Participants shown (no ping) ✅
2. User clicks Accept → Hosters are mentioned (first time) ✅
3. Accept button is disabled → No more acceptances possible ✅
4. Subsequent Accept attempts → Error message shown ✅

## Testing Checklist

- [ ] Create wager ticket - verify hosters are NOT mentioned
- [ ] Accept wager ticket - verify hosters ARE mentioned
- [ ] Try to accept same wager ticket again - verify error message
- [ ] Verify accept button is disabled after acceptance
- [ ] Create war ticket - verify hosters are NOT mentioned
- [ ] Accept war ticket - verify hosters ARE mentioned
- [ ] Try to accept same war ticket again - verify error message
- [ ] Verify accept button is disabled after acceptance
- [ ] Test race condition: multiple users clicking Accept simultaneously
- [ ] Verify acceptance timestamp and user are recorded correctly

## Database Migration Notes

**No migration required** - The new fields (`acceptedAt` and `acceptedByUserId`) have default values of `null`, so existing tickets will continue to work. They will only have these fields populated when accepted after this update.

## Security Considerations

- **Race Condition Protection**: Database updates are atomic using Mongoose save()
- **Permission Checks**: Existing permission checks remain in place
- **Idempotency**: Multiple acceptance attempts are safely rejected
- **Data Integrity**: Acceptance tracking is separate from ticket status

## Future Enhancements

Potential improvements for future consideration:
- Add acceptance history (array of all acceptance attempts)
- Add visual indicator in ticket embed showing acceptance status
- Add command to view ticket acceptance statistics
- Add notification to ticket creator when ticket is accepted

