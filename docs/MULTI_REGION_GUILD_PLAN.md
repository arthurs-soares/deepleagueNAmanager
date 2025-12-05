# Multi-Region Guild Registration Plan

> **Goal:** Allow a guild to be registered in multiple regions, with the same members, leaders, co-leaders, and managers across those regions. Each region instance has its own stats (wins, losses, ELO) while sharing identity and membership.

---

## 📋 Executive Summary

This plan enables guilds to operate in multiple regions simultaneously (e.g., "TeamAlpha" in NA East AND Europe). Each region has independent war stats but shares:
- Guild identity (name, icon, banner, description, color)
- Members, Leaders, Co-Leaders, Managers
- Rosters (mainRoster, subRoster)

---

## 🏗️ Architecture Options

### Option A: Array-Based Regions (Recommended)

**Concept:** Change `region` from a single string to an array of region-specific data.

```javascript
// NEW guildSchema structure
const guildSchema = new mongoose.Schema({
  // Shared identity fields (unchanged)
  name: { type: String, required: true, trim: true, maxlength: 100 },
  leader: { type: String, required: true, trim: true, maxlength: 100 },
  registeredBy: { type: String, required: true },
  discordGuildId: { type: String, required: true },
  status: { type: String, enum: ['ativa', 'inativa', 'suspensa'], default: 'ativa' },
  bannerUrl: { type: String, trim: true },
  iconUrl: { type: String, trim: true },
  description: { type: String, trim: true, maxlength: 1000 },
  color: { type: String, trim: true },
  members: [memberSchema],
  mainRoster: { type: [String], default: [] },
  subRoster: { type: [String], default: [] },
  managers: { type: [String], default: [], validate: { ... } },

  // NEW: Region-specific stats (replaces single region field)
  regions: [{
    region: {
      type: String,
      enum: ['Europe', 'South America', 'NA East', 'NA West'],
      required: true
    },
    wins: { type: Number, default: 0, min: 0 },
    losses: { type: Number, default: 0, min: 0 },
    elo: { type: Number, default: 1000, min: 0, max: 5000 },
    registeredAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' }
  }],

  // DEPRECATED: Keep for migration, but use regions array instead
  region: { type: String }, // Legacy - nullable after migration
  wins: { type: Number, default: 0 }, // Legacy - aggregate or remove
  losses: { type: Number, default: 0 }, // Legacy
  elo: { type: Number, default: 1000 }, // Legacy

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

**Pros:**
- ✅ Single document per guild (simpler membership management)
- ✅ Easy to show all regions a guild is in
- ✅ Atomic operations for shared data
- ✅ Members are naturally shared

**Cons:**
- ⚠️ Requires updating all queries that filter by region
- ⚠️ Index changes needed

---

### Option B: Separate Documents per Region (Alternative)

**Concept:** Keep one document per guild-region combination, link via `parentGuildId`.

```javascript
// Guild stays mostly the same, but add:
const guildSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // Optional: link to "primary" guild for multi-region
  primaryGuildId: { type: mongoose.Schema.Types.ObjectId, ref: 'Guild', default: null },
  
  // Indicates if this is a regional instance
  isRegionalInstance: { type: Boolean, default: false },
});
```

**Pros:**
- ✅ Minimal schema changes
- ✅ Existing queries mostly work

**Cons:**
- ❌ Members/leaders need sync across documents
- ❌ More complex to manage roster changes
- ❌ Data duplication and potential inconsistency

---

## ✅ Recommended Approach: Option A (Array-Based Regions)

---

## 📝 Implementation Plan

### Phase 1: Schema Migration

#### 1.1 Update `guildSchema.js`

**File:** `src/models/schemas/guildSchema.js`

```javascript
// Add new regionStats sub-schema
const regionStatsSchema = new mongoose.Schema({
  region: {
    type: String,
    enum: ['Europe', 'South America', 'NA East', 'NA West'],
    required: true
  },
  wins: { type: Number, default: 0, min: 0 },
  losses: { type: Number, default: 0, min: 0 },
  elo: { type: Number, default: 1000, min: 0, max: 5000 },
  registeredAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  }
}, { _id: false });

// In guildSchema:
// Replace single region with regions array
regions: {
  type: [regionStatsSchema],
  default: [],
  validate: {
    validator: v => v.length >= 1,
    message: 'Guild must be registered in at least one region.'
  }
}
```

#### 1.2 Create Migration Script

**File:** `scripts/migrate-guild-regions.js`

```javascript
/**
 * Migration: Convert single region to regions array
 * - Moves region, wins, losses, elo to regions[0]
 * - Maintains backward compatibility
 */
async function migrateGuildRegions() {
  const guilds = await Guild.find({ region: { $exists: true, $ne: null } });
  
  for (const guild of guilds) {
    if (guild.regions?.length > 0) continue; // Already migrated
    
    guild.regions = [{
      region: guild.region,
      wins: guild.wins || 0,
      losses: guild.losses || 0,
      elo: guild.elo || 1000,
      registeredAt: guild.createdAt,
      status: 'active'
    }];
    
    await guild.save();
  }
}
```

---

### Phase 2: Database Indices Update

#### 2.1 Update `guildIndices.js`

**File:** `src/models/indices/guildIndices.js`

```javascript
function applyGuildIndices(schema) {
  // Unique: guild name per Discord server (unchanged)
  schema.index({ discordGuildId: 1, name: 1 }, { unique: true });
  
  // NEW: Query by regions
  schema.index({ discordGuildId: 1, 'regions.region': 1 });
  schema.index({ discordGuildId: 1, 'regions.region': 1, 'regions.elo': -1 });
  schema.index({ discordGuildId: 1, 'regions.region': 1, 'regions.wins': -1 });
  
  // Existing indices...
  schema.index({ discordGuildId: 1 });
  schema.index({ registeredBy: 1 });
  schema.index({ discordGuildId: 1, 'members.userId': 1 });
  schema.index({ discordGuildId: 1, status: 1 });
}
```

---

### Phase 3: Static Methods Update

#### 3.1 Update `guildStatics.js`

**File:** `src/models/statics/guildStatics.js`

```javascript
/**
 * Find guilds by region
 * @param {string} discordGuildId - Discord server ID
 * @param {string} region - Region name
 * @returns {Promise} Guilds in that region
 */
function findByRegion(discordGuildId, region) {
  return this.find({
    discordGuildId,
    'regions.region': region,
    'regions.status': 'active'
  });
}

/**
 * Get guild's stats for a specific region
 * @param {string} guildId - Guild document ID
 * @param {string} region - Region name
 * @returns {Object|null} Region stats or null
 */
function getRegionStats(guildDoc, region) {
  if (!guildDoc?.regions) return null;
  return guildDoc.regions.find(r => r.region === region) || null;
}

/**
 * Check if guild is registered in a region
 */
function isRegisteredInRegion(guildDoc, region) {
  return guildDoc?.regions?.some(r => r.region === region) || false;
}

/**
 * Add guild to a new region
 */
async function addRegion(guildId, region) {
  return this.findByIdAndUpdate(
    guildId,
    {
      $push: {
        regions: {
          region,
          wins: 0,
          losses: 0,
          elo: 1000,
          registeredAt: new Date(),
          status: 'active'
        }
      }
    },
    { new: true }
  );
}

/**
 * Update region-specific stats
 */
async function updateRegionStats(guildId, region, updates) {
  const setFields = {};
  for (const [key, value] of Object.entries(updates)) {
    setFields[`regions.$.${key}`] = value;
  }
  
  return this.findOneAndUpdate(
    { _id: guildId, 'regions.region': region },
    { $set: setFields },
    { new: true }
  );
}

/**
 * Increment wins/losses for a specific region
 */
async function incrementRegionStat(guildId, region, field, amount = 1) {
  return this.findOneAndUpdate(
    { _id: guildId, 'regions.region': region },
    { $inc: { [`regions.$.${field}`]: amount } },
    { new: true }
  );
}
```

---

### Phase 4: Command Updates

#### 4.1 Update `/guild register`

**File:** `src/commands/guild/guild.js`

Add option to register in additional region:

```javascript
// Add new subcommand: add-region
.addSubcommand(sub =>
  sub
    .setName('add-region')
    .setDescription('Register an existing guild in a new region')
    .addStringOption(opt =>
      opt
        .setName('name')
        .setDescription('Guild name')
        .setAutocomplete(true)
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName('region')
        .setDescription('New region to register in')
        .setRequired(true)
        .addChoices(
          { name: 'Europe', value: 'Europe' },
          { name: 'South America', value: 'South America' },
          { name: 'NA East', value: 'NA East' },
          { name: 'NA West', value: 'NA West' }
        )
    )
)
```

#### 4.2 Update Register Flow

**File:** `src/utils/guilds/register.js`

```javascript
/**
 * Register a new guild (first region)
 */
async function registerGuild(guildData) {
  const { name, leader, leaderId, registeredBy, discordGuildId, region, iconUrl } = guildData;
  
  const existingGuild = await Guild.findByName(name, discordGuildId);
  if (existingGuild) {
    return { success: false, message: `Guild "${name}" already exists.` };
  }
  
  const newGuild = new Guild({
    name: String(name).trim(),
    leader: String(leader).trim(),
    registeredBy,
    discordGuildId,
    iconUrl: iconUrl || null,
    regions: [{
      region,
      wins: 0,
      losses: 0,
      elo: 1000,
      registeredAt: new Date(),
      status: 'active'
    }],
    members: [{
      userId: leaderId || registeredBy,
      username: String(leader).trim(),
      role: 'lider',
      joinedAt: new Date()
    }]
  });
  
  const savedGuild = await newGuild.save();
  return { success: true, guild: savedGuild };
}

/**
 * Add existing guild to a new region
 */
async function addGuildToRegion(guildId, region, addedBy) {
  const guild = await Guild.findById(guildId);
  if (!guild) {
    return { success: false, message: 'Guild not found.' };
  }
  
  if (guild.regions.some(r => r.region === region)) {
    return { success: false, message: `Guild already registered in ${region}.` };
  }
  
  guild.regions.push({
    region,
    wins: 0,
    losses: 0,
    elo: 1000,
    registeredAt: new Date(),
    status: 'active'
  });
  
  await guild.save();
  return { success: true, guild, message: `Guild registered in ${region}.` };
}
```

---

### Phase 5: Guild Panel Updates

#### 5.1 Region Selector in Panel

**File:** `src/utils/embeds/guildPanelEmbed.js`

The guild panel must show region-specific stats and allow switching between regions:

```javascript
async function buildGuildPanelDisplayComponents(guild, discordGuild, selectedRegion = null) {
  // If guild has multiple regions, show region selector
  if (guild.regions.length > 1) {
    // Add region selector dropdown
    const regionSelect = new StringSelectMenuBuilder()
      .setCustomId(`guild_panel:select_region:${guild._id}`)
      .setPlaceholder('Select Region')
      .addOptions(
        guild.regions.map(r => ({
          label: r.region,
          value: r.region,
          default: r.region === selectedRegion
        }))
      );
    // Add to container...
  }
  
  // Get stats for selected region (or first region)
  const regionStats = selectedRegion
    ? guild.regions.find(r => r.region === selectedRegion)
    : guild.regions[0];
  
  // Display regionStats.wins, regionStats.losses, regionStats.elo
}
```

#### 5.2 Add Region Select Handler

**File:** `src/interactions/string-selects/guild/selectRegion.js`

```javascript
async function handle(interaction) {
  const [, , guildId] = interaction.customId.split(':');
  const selectedRegion = interaction.values?.[0];
  
  const guild = await Guild.findById(guildId);
  if (!guild) {
    return interaction.update({ content: '❌ Guild not found.', components: [] });
  }
  
  // Rebuild panel with selected region
  const container = await buildGuildPanelDisplayComponents(
    guild,
    interaction.guild,
    selectedRegion
  );
  
  return interaction.update({
    components: [container],
    flags: MessageFlags.IsComponentsV2
  });
}
```

---

### Phase 6: War System Updates

#### 6.1 War Creation with Region Context

Wars must be region-specific. When creating a war:

**File:** `src/interactions/selects/warSelectRegion.js`

```javascript
// When selecting opponent, filter by region AND check guild is active in that region
const opponents = await Guild.find({
  discordGuildId: interaction.guild.id,
  _id: { $ne: guildAId },
  'regions.region': selectedRegion,
  'regions.status': 'active'
}).select('name regions');
```

#### 6.2 War Result Processing

**File:** Update war result handlers

```javascript
// When recording win/loss, update specific region stats
async function recordWarResult(warDoc, winnerGuildId) {
  const war = await War.findById(warDoc._id).populate('guildAId guildBId');
  const region = getWarRegion(war); // Determine region from war context
  
  // Update winner's region stats
  await Guild.incrementRegionStat(winnerGuildId, region, 'wins', 1);
  
  // Update loser's region stats
  const loserId = war.guildAId._id.equals(winnerGuildId)
    ? war.guildBId._id
    : war.guildAId._id;
  await Guild.incrementRegionStat(loserId, region, 'losses', 1);
  
  // Update ELO for both guilds in this region
  await updateRegionElo(winnerGuildId, loserId, region);
}
```

---

### Phase 7: Leaderboard Updates

#### 7.1 Region-Specific Leaderboards

**File:** `src/utils/leaderboard/guildLeaderboard.js`

```javascript
/**
 * Get guild leaderboard for a specific region
 */
async function getGuildLeaderboard(discordGuildId, region, options = {}) {
  const { page = 1, limit = 10, sortBy = 'elo' } = options;
  
  // Use aggregation to sort by region-specific stats
  const guilds = await Guild.aggregate([
    { $match: { discordGuildId, 'regions.region': region } },
    { $unwind: '$regions' },
    { $match: { 'regions.region': region, 'regions.status': 'active' } },
    { $sort: { [`regions.${sortBy}`]: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    {
      $project: {
        name: 1,
        iconUrl: 1,
        regionStats: '$regions'
      }
    }
  ]);
  
  return guilds;
}
```

---

### Phase 8: User Guild Info Updates

#### 8.1 Update `getUserGuildInfo`

**File:** `src/utils/guilds/userGuildInfo.js`

Add optional region parameter:

```javascript
/**
 * Return user's guild information
 * @param {string} discordGuildId - Discord server ID
 * @param {string} userId - User ID
 * @param {string} [region] - Optional: filter by specific region
 */
async function getUserGuildInfo(discordGuildId, userId, region = null) {
  const query = {
    discordGuildId,
    $or: [
      { members: { $elemMatch: { userId } } },
      { mainRoster: userId },
      { subRoster: userId }
    ]
  };
  
  // If region specified, filter guilds active in that region
  if (region) {
    query['regions.region'] = region;
    query['regions.status'] = 'active';
  }
  
  const candidates = await Guild.find(query).sort({ createdAt: -1 });
  // ... rest of function
}
```

---

## 📁 Files to Modify

### Models
| File | Changes |
|------|---------|
| `src/models/schemas/guildSchema.js` | Add `regionStatsSchema`, change `regions` to array |
| `src/models/indices/guildIndices.js` | Add region-based indices |
| `src/models/statics/guildStatics.js` | Add region query methods |

### Commands
| File | Changes |
|------|---------|
| `src/commands/guild/guild.js` | Add `add-region` subcommand |
| `src/utils/commands/guildHandlers.js` | Add `handleAddRegion` handler |
| `src/utils/guilds/register.js` | Update for regions array, add `addGuildToRegion` |

### Utils
| File | Changes |
|------|---------|
| `src/utils/guilds/userGuildInfo.js` | Add optional region filter |
| `src/utils/guilds/guildMemberManager.js` | No changes (members are shared) |
| `src/utils/embeds/guildPanelEmbed.js` | Add region selector, show region stats |
| `src/utils/guilds/guildPanelComponents.js` | Add region switch button |

### Interactions
| File | Changes |
|------|---------|
| `src/interactions/string-selects/guild/selectRegion.js` | NEW: Handle region selection |
| `src/interactions/selects/warSelectRegion.js` | Update query for multi-region |

### War System
| File | Changes |
|------|---------|
| `src/utils/war/warRanking.js` | Update to use region-specific stats |
| War result handlers | Update win/loss to specific region |

### Leaderboard
| File | Changes |
|------|---------|
| `src/utils/leaderboard/guildLeaderboard.js` | Aggregate by region stats |

### Scripts
| File | Description |
|------|-------------|
| `scripts/migrate-guild-regions.js` | NEW: Migration script |

---

## 🔄 Migration Strategy

1. **Backup Database** - Full backup before migration
2. **Deploy Schema Changes** - Add `regions` field (additive, non-breaking)
3. **Run Migration Script** - Convert existing `region` → `regions[0]`
4. **Deploy Code Changes** - All updated handlers
5. **Verify** - Test guild panel, wars, leaderboards
6. **Cleanup** - Remove legacy `region`, `wins`, `losses`, `elo` fields (optional, can keep for safety)

---

## ⚠️ Edge Cases to Handle

1. **User in multiple guilds across regions**
   - Already handled: user can only be in ONE guild per Discord server
   - Multi-region is per guild, not per user

2. **War between guilds in different regions**
   - Wars are region-specific
   - Guilds can only war within the same region

3. **Transferring leadership**
   - Affects ALL regions (leader is shared)
   - No changes needed

4. **Removing a guild from a region**
   - Add `guild remove-region` command
   - Set `regions[x].status = 'inactive'`

5. **Guild Panel default region**
   - Show user's most active region, or first region
   - Allow switching via dropdown

---

## 🎯 Summary

This plan enables multi-region guild registration by:

1. **Converting `region` to `regions[]` array** with per-region stats
2. **Keeping shared data** (members, leaders, rosters) at guild level
3. **Adding region-specific stats** (wins, losses, ELO) per region
4. **Updating queries** to filter/aggregate by region
5. **Enhancing guild panel** with region selector
6. **Updating war system** to track region context

The recommended approach (Option A) minimizes data duplication while maintaining full functionality for multi-region operations.

---

## 📅 Estimated Effort

| Phase | Effort |
|-------|--------|
| Schema Migration | 2-3 hours |
| Indices & Statics | 1-2 hours |
| Command Updates | 2-3 hours |
| Guild Panel Updates | 2-3 hours |
| War System Updates | 3-4 hours |
| Leaderboard Updates | 2 hours |
| Testing & QA | 3-4 hours |
| **Total** | **15-21 hours** |
