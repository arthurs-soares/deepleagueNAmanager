# Tag-Based Role Assignment System

## Overview

The Tag-Based Role Assignment System automatically assigns a Discord role to members whose **Primary Guild** has the "DLSA" tag. This feature provides seamless role management based on Discord's official server tags feature.

## Features

- **Automatic Detection**: Monitors Primary Guild changes in real-time
- **Case-Insensitive**: Detects "DLSA", "dlsa", "Dlsa", etc.
- **Global Processing**: Works across all servers where the bot is present
- **Auto-Assignment**: Automatically adds the configured role when Primary Guild tag matches
- **Auto-Removal**: Automatically removes the role when Primary Guild tag changes
- **Permission-Aware**: Checks bot permissions before attempting role changes
- **Error-Resilient**: Gracefully handles errors without disrupting server operations

## Configuration

### Setting Up the Tag Role

1. **Run the `/config` command** (requires Administrator permission)
2. **Click the "Roles" button**
3. **Select "Tag Role (DLSA)" from the dropdown menu**
4. **Choose the role** you want to assign to members with the DLSA tag
5. **Done!** The system will now automatically manage this role

### Viewing Current Configuration

Use `/config` to view all configured roles, including the Tag Role (DLSA).

## How It Works

### Detection Logic

The system monitors the `UserUpdate` event and:

1. Checks if the user's Primary Guild changed
2. Compares the old and new Primary Guild tags
3. Detects if the tag is "DLSA"
4. Processes all servers where the user is a member
5. Assigns or removes the configured role in each server

### Primary Guild

Discord's Primary Guild is the server tag that appears on a user's profile. Users can set this in their Discord settings under "Server Profiles" → "Primary Guild".

### Tag Detection

The system checks if `user.primaryGuild.tag === "DLSA"` (case-insensitive).

✅ **Will be detected:**
- Primary Guild tag: `DLSA`
- Primary Guild tag: `dlsa`
- Primary Guild tag: `DlSa`

❌ **Will NOT be detected:**
- Primary Guild tag: `DLS` (different tag)
- Primary Guild tag: `DSLA` (different tag)
- No Primary Guild set

## Technical Details

### Files Created

1. **`src/events/userUpdate.js`**
   - Event handler for user updates
   - Monitors Primary Guild changes
   - Triggers role assignment/removal across all guilds

2. **`src/utils/misc/tagDetection.js`**
   - Primary Guild tag detection utilities
   - Tag comparison logic
   - Tag change detection

3. **`src/utils/misc/tagRoleManager.js`**
   - Role assignment utilities
   - Multi-guild processing
   - Permission checking
   - Error handling for role operations

### Files Modified

1. **`src/models/settings/RoleConfig.js`**
   - Added `tagRoleId` field to schema

2. **`src/utils/misc/roleConfig.js`**
   - Added `tagRoleId` to in-memory defaults

3. **`src/interactions/buttons/config/configOpenRoles.js`**
   - Added Tag Role display
   - Added Tag Role option to dropdown

4. **`src/interactions/string-selects/configRoleSelect.js`**
   - Added Tag Role configuration mapping

5. **`src/commands/admin/config.js`**
   - Added Tag Role to main config display

### Database Schema

```javascript
{
  tagRoleId: { type: String, default: null }
}
```

### Event Flow

```
Member Nickname Change
        ↓
GuildMemberUpdate Event
        ↓
Detect Tag Change
        ↓
Get Role Configuration
        ↓
Check Bot Permissions
        ↓
Assign/Remove Role
        ↓
Log Action
```

## Permissions Required

### Bot Permissions
- **Manage Roles**: Required to assign/remove roles
- The bot's role must be **higher** than the tag role in the role hierarchy

### User Permissions
- **Administrator**: Required to configure the tag role via `/config`

## Error Handling

The system includes comprehensive error handling:

- **Missing Permissions**: Logs warning, skips role change
- **Invalid Role ID**: Silently skips (no configured role)
- **Member Not Found**: Gracefully handles edge cases
- **Database Offline**: Uses in-memory defaults
- **Discord API Errors**: Logs error, continues operation

## Logging

All role assignments and removals are logged to the console:

```
[TagRole] Assigned role 123456789 to Username#1234
[TagRole] Removed role 123456789 from Username#1234
[TagRole] Bot lacks ManageRoles permission
```

## Best Practices

1. **Role Hierarchy**: Ensure the bot's role is above the tag role
2. **Unique Role**: Use a dedicated role for tag-based assignment
3. **Clear Communication**: Inform members about the tag requirement
4. **Monitor Logs**: Check console logs for permission issues
5. **Test First**: Test with a test role before using production roles

## Troubleshooting

### Role Not Being Assigned

**Check:**
1. Is the tag role configured in `/config`?
2. Does the bot have "Manage Roles" permission?
3. Is the bot's role higher than the tag role?
4. Is the tag spelled correctly in the nickname?

### Role Not Being Removed

**Check:**
1. Was the tag completely removed from the nickname?
2. Does the bot still have "Manage Roles" permission?
3. Check console logs for error messages

### Configuration Not Saving

**Check:**
1. Is the database connected?
2. Do you have Administrator permission?
3. Check console logs for database errors

## Future Enhancements

Potential improvements for future versions:

- [ ] Configurable tag (not hardcoded to "DLSA")
- [ ] Multiple tag-role mappings
- [ ] Tag format validation (e.g., must be in brackets)
- [ ] Role assignment notifications (DM or channel)
- [ ] Audit log integration
- [ ] Statistics tracking (assignments/removals)

## Code Standards Compliance

This implementation follows all project coding standards:

- ✅ All code and comments in English
- ✅ Functions under 30 lines
- ✅ Reusable logic extracted to utilities
- ✅ Proper error handling with try/catch
- ✅ Uses `MessageFlags.Ephemeral` (not deprecated `ephemeral: true`)
- ✅ JSDoc comments for all functions
- ✅ Graceful degradation for database failures
- ✅ No hardcoded values (except the tag constant)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review console logs for error messages
3. Verify bot permissions and role hierarchy
4. Ensure database connection is stable

