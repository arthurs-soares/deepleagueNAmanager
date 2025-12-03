# 📋 Command Naming Organization Plan

> **Status: ✅ IMPLEMENTED**

---

## � Final Command Structure

```
src/commands/
├── admin/
│   ├── admin.js     # /admin war, /admin wager, /admin system
│   ├── config.js    # /config
│   └── event.js     # /event point add/remove
├── cooldown/
│   └── cooldown.js  # /cooldown set, increase, decrease, reset, check
├── general/
│   ├── help.js      # /help
│   ├── ping.js      # /ping
│   └── support.js   # /support
├── guild/
│   └── guild.js     # /guild panel, register, delete, view, set-score
├── leaderboard/
│   └── leaderboard.js  # /leaderboard refresh
├── ticket/
│   └── ticket.js    # /ticket close, add-user
├── user/
│   └── user.js      # /user profile, fix-guild, reset-ratings
├── wager/
│   └── wager.js     # /wager stats, leaderboard
└── war/
    └── war.js       # /war log, edit, tickets
```

---

## 🎨 Quick Reference Card

| Command | Description | Access |
|---------|-------------|--------|
| `/help` | Show help menu | All |
| `/ping` | Bot latency | All |
| `/support` | Support info | All |
| `/config` | Server configuration | Admin |
| `/guild panel` | View guild panel | All |
| `/guild register` | Register new guild | Admin |
| `/guild delete` | Delete a guild | Admin |
| `/guild view` | View guild details | All |
| `/guild set-score` | Set guild score | Admin/Mod/Hoster |
| `/war log` | Log war result | Hoster |
| `/war edit` | Edit war log | Hoster |
| `/war tickets` | Set war tickets channel | Admin |
| `/wager stats` | View wager statistics | All |
| `/wager leaderboard` | Wager rankings | All |
| `/ticket close` | Close a ticket | Staff |
| `/ticket add-user` | Add user to ticket | Staff |
| `/user profile` | View user profile | All |
| `/user fix-guild` | Fix user guild data | Admin/Mod |
| `/user reset-ratings` | Reset user ratings | Admin/Mod |
| `/cooldown set` | Set cooldown | Leader/Admin |
| `/cooldown increase` | Increase cooldown | Leader/Admin |
| `/cooldown decrease` | Decrease cooldown | Leader/Admin |
| `/cooldown reset` | Reset cooldown | Leader/Admin |
| `/cooldown check` | Check cooldown | Leader/Admin |
| `/event point add` | Add event points | Admin |
| `/event point remove` | Remove event points | Admin |
| `/leaderboard refresh` | Refresh leaderboards | Admin |
| `/admin war mark-dodge` | Mark war dodge | Admin |
| `/admin war undo-dodge` | Undo dodge mark | Admin |
| `/admin war revert-result` | Revert war result | Admin |
| `/admin wager record` | Record wager | Admin |
| `/admin system sync` | Sync guilds | Admin |
| `/admin system db-status` | Database status | Admin |
| `/admin system db-reset` | Reset DB connection | Admin |

---

## ⚠️ Migration Map (Old → New)

| Old Command | New Command |
|-------------|-------------|
| `/register` | `/guild register` |
| `/delete` | `/guild delete` |
| `/view` | `/guild view` |
| `/setscore` | `/guild set-score` |
| `/log war` | `/war log` |
| `/log edit` | `/war edit` |
| `/wartickets` | `/war tickets` |
| `/wagerstats` | `/wager stats` |
| `/wagerlb` | `/wager leaderboard` |
| `/closeticket` | `/ticket close` |
| `/ticketadd` | `/ticket add-user` |
| `/profile` | `/user profile` |
| `/fixuserguild` | `/user fix-guild` |
| `/resetuserratings` | `/user reset-ratings` |
| `/managecooldown` | `/cooldown` |
| `/refreshleaderboards` | `/leaderboard refresh` |
| `/sync` | `/admin system sync` |
| `/database-status` | `/admin system db-status` |
