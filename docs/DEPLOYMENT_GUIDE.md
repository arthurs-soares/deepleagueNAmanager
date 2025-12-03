# Daily Reward System Fixes - Deployment Guide

## Quick Start

Follow these steps to deploy the daily reward system fixes to your production environment.

## Prerequisites

- Node.js installed
- Bot token configured in `.env`
- MongoDB connection active
- Bot invited to at least one Discord server

## Step-by-Step Deployment

### 1. Backup Current System

```bash
# Backup your database
mongodump --uri="your_mongodb_uri" --out=backup_$(date +%Y%m%d)

# Backup current code (if not using git)
cp -r . ../backup_$(date +%Y%m%d)
```

### 2. Update Code

If using git:
```bash
git pull origin main
```

If manually updating:
- Copy all new/modified files to your server
- Ensure file permissions are correct

### 3. Install Dependencies

```bash
npm install
```

### 4. Deploy Slash Commands

The new `/admin rewards` commands need to be registered with Discord:

```bash
# If you have a deploy script
npm run deploy-commands

# Or manually
node src/utils/system/deployCommands.js
```

**Wait 5-10 minutes** for Discord to propagate the new commands globally.

### 5. Test Primary Guild API

Before enabling the feature, verify if Discord's Primary Guild API is working:

```bash
node tests/testPrimaryGuildAPI.js
```

**Review the output carefully:**

#### ✅ If Primary Guild is Working:
```
user.primaryGuild exists: true
user.primaryGuild.tag: DLSA
```
→ Proceed to Step 6

#### ❌ If Primary Guild is NOT Working:
```
user.primaryGuild exists: false
user.primaryGuild value: undefined
```
→ **STOP**: The feature will not work. See "Alternative Solutions" below.

### 6. Restart the Bot

```bash
# If using PM2
pm2 restart bot

# If using systemd
sudo systemctl restart discord-bot

# If running manually
# Stop the current process (Ctrl+C)
node src/index.js
```

### 7. Verify Bot is Running

Check the console output for:
```
✅ Bot is ready! Logged in as YourBot#1234
[DailyReward] Scheduled daily rewards at 00:00 UTC
```

### 8. Test Admin Commands

In Discord, run:

```
/admin rewards status
```

**Expected Response:**
- Shows current configuration
- Status: ❌ Disabled (default)
- Reward amount: 5 coins per day
- Schedule: 00:00 UTC

### 9. Enable Daily Rewards

For each server where you want to enable the feature:

```
/admin rewards enable amount:5
```

**Expected Response:**
- ✅ Daily rewards enabled: 5 coin(s) per day
- Next steps provided

### 10. Test Reward Processing

```
/admin rewards test
```

**Expected Response:**
- Processing statistics
- Members checked
- Rewards granted
- Any warnings or errors

**Check Console Logs:**
Look for detailed output with:
- `[DailyReward]` prefix
- Processing statistics
- Any warnings about Primary Guild

### 11. Monitor First Automatic Run

The system runs automatically at:
- **Midnight UTC** (daily)
- **30 seconds after bot startup**

Check logs after the next scheduled run:
```bash
# If using PM2
pm2 logs bot

# If using systemd
sudo journalctl -u discord-bot -f

# If running manually
# Watch the console output
```

## Verification Checklist

- [ ] Bot is running without errors
- [ ] `/admin rewards` commands are available
- [ ] Primary Guild API test completed
- [ ] Daily rewards enabled for desired servers
- [ ] Test command shows expected results
- [ ] Console logs show detailed statistics
- [ ] No critical warnings in logs

## Rollback Procedure

If issues occur:

### 1. Disable the Feature
```
/admin rewards disable
```

### 2. Restore Previous Code
```bash
# If using git
git checkout previous_commit_hash

# If using backup
cp -r ../backup_YYYYMMDD/* .
```

### 3. Restart Bot
```bash
pm2 restart bot
# or
sudo systemctl restart discord-bot
```

### 4. Restore Database (if needed)
```bash
mongorestore --uri="your_mongodb_uri" backup_YYYYMMDD/
```

## Alternative Solutions

### If Primary Guild API is Unavailable

The daily reward system **will not work** without the Primary Guild API. You have three options:

#### Option 1: Wait for Discord API Update
- Monitor Discord.js changelog
- Check Discord API documentation
- Wait for feature restoration

#### Option 2: Implement Role-Based Detection
1. Create a "DLSA Member" role in Discord
2. Modify `src/utils/misc/tagDetection.js`:
   ```javascript
   function hasTag(member, tag) {
     // Check for role instead of Primary Guild
     const roleId = 'YOUR_ROLE_ID';
     return member.roles.cache.has(roleId);
   }
   ```
3. Assign role to eligible users
4. Test and deploy

#### Option 3: Implement Database-Stored Tags
1. Create a new collection for user tags
2. Add commands for tag registration
3. Modify tag detection to check database
4. Test and deploy

See `docs/daily-reward-system.md` for detailed implementation guides.

## Troubleshooting

### Commands Not Showing Up

**Issue:** `/admin rewards` commands don't appear in Discord

**Solutions:**
1. Wait 5-10 minutes for propagation
2. Re-run deploy commands script
3. Check bot has `applications.commands` scope
4. Verify bot token is correct

### "Database not connected" Error

**Issue:** Commands fail with database error

**Solutions:**
1. Check MongoDB connection string in `.env`
2. Verify MongoDB server is running
3. Check network connectivity
4. Review database logs

### No Rewards Being Granted

**Issue:** Test shows 0 rewards granted

**Solutions:**
1. Run Primary Guild API test
2. Check if users have DLSA tag set
3. Verify `dailyRewardEnabled: true` in database
4. Check console logs for detailed errors
5. Ensure users haven't already received reward today

### High "primaryGuild is null/undefined" Count

**Issue:** Most users show null primaryGuild

**Solutions:**
1. This indicates Primary Guild API is unavailable
2. Run diagnostic test to confirm
3. Consider alternative implementations
4. Disable feature until resolved

## Monitoring

### Daily Checks

Monitor these metrics daily:
- Number of rewards granted
- Error count
- Primary Guild null count
- Processing duration

### Weekly Review

Review these weekly:
- Total rewards distributed
- User participation rate
- System performance
- Any recurring errors

### Alerts to Set Up

Consider setting up alerts for:
- Processing errors > 5%
- Primary Guild null count > 80%
- Processing duration > 10 seconds
- Database connection failures

## Support

### Getting Help

1. Check console logs for `[DailyReward]` entries
2. Run `/admin rewards test` for diagnostics
3. Review `docs/daily-reward-system.md`
4. Check `DAILY_REWARD_FIXES_SUMMARY.md`
5. Run `node tests/testPrimaryGuildAPI.js`

### Reporting Issues

When reporting issues, include:
- Console logs (last 100 lines)
- Output of `/admin rewards test`
- Output of `node tests/testPrimaryGuildAPI.js`
- Discord.js version (`npm list discord.js`)
- Node.js version (`node --version`)
- MongoDB version

## Next Steps

After successful deployment:

1. **Monitor for 24 hours** - Watch first automatic run
2. **Review statistics** - Check reward distribution
3. **Gather feedback** - Ask users about their experience
4. **Optimize if needed** - Adjust reward amounts or schedule
5. **Document learnings** - Note any issues for future reference

## Success Criteria

Deployment is successful when:
- ✅ Bot runs without errors
- ✅ Commands work as expected
- ✅ Test shows rewards being granted
- ✅ Automatic runs complete successfully
- ✅ Users receive coins as expected
- ✅ No critical warnings in logs

---

**Deployment Date:** _____________

**Deployed By:** _____________

**Notes:** _____________

