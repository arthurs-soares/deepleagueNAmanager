# Primary Guild Tag Role System - Testing Guide

## Overview

This guide provides comprehensive testing procedures for the Primary Guild Tag-Based Role Assignment System.

## Prerequisites

Before testing:
1. ✅ Bot is running and connected to Discord
2. ✅ Tag role is configured via `/config`
3. ✅ Bot has `ManageRoles` permission
4. ✅ Bot's role is above the tag role in hierarchy
5. ✅ You have access to a server with the "DLSA" tag
6. ✅ You can change your Primary Guild in Discord settings

## Pre-Testing Setup

### 1. Create a Test Role

1. Go to Server Settings → Roles
2. Create a new role called "DLSA Member" (or any name)
3. Give it a distinctive color for easy identification
4. Ensure the bot's role is **above** this role in the hierarchy

### 2. Verify Bot Permissions

1. Check that the bot has "Manage Roles" permission
2. Verify the bot's role is higher than the test role
3. Check bot can see and access the role

### 3. Configure Tag Role

1. Run `/config` command
2. Click "Roles" button
3. Select "Tag Role" from dropdown
4. Choose the test role you created
5. Verify configuration saved successfully

## Test Cases

### Test 1: Basic Tag Detection

**Objective**: Verify role is assigned when Primary Guild has DLSA tag

**Steps**:
1. Open Discord Settings → Server Profiles
2. Find a server with the "DLSA" tag
3. Click "Set as Primary Guild"
4. Wait 2-3 seconds
5. Check your roles in the test server

**Expected Result**:
- ✅ Tag role is automatically assigned
- ✅ Console logs show: `[TagRole] Assigned role {roleId} to {your.tag}`

---

### Test 2: Tag Removal

**Objective**: Verify role is removed when Primary Guild changes

**Steps**:
1. Ensure you have the tag role from Test 1
2. Open Discord Settings → Server Profiles
3. Select a different server (without DLSA tag)
4. Click "Set as Primary Guild"
5. Wait 2-3 seconds
6. Check your roles in the test server

**Expected Result**:
- ✅ Tag role is automatically removed
- ✅ Console logs show: `[TagRole] Removed role {roleId} from {your.tag}`

---

### Test 3: Case Insensitivity

**Objective**: Verify tag detection is case-insensitive

**Steps**:
1. Find servers with tags: "DLSA", "dlsa", "DlSa"
2. Set each as Primary Guild one by one
3. Check if role is assigned for each variation

**Expected Result**:
- ✅ Role assigned for all case variations

---

### Test 4: Multiple Guilds

**Objective**: Verify role is assigned in ALL guilds where bot is present

**Setup**: Bot must be in at least 2 test servers

**Steps**:
1. Set Primary Guild to server with DLSA tag
2. Check roles in Server A
3. Check roles in Server B

**Expected Result**:
- ✅ Role assigned in both servers
- ✅ Role assigned in all servers where bot is present

---

### Test 5: Permission Handling

**Objective**: Verify graceful handling when bot lacks permissions

**Steps**:
1. Remove "Manage Roles" permission from bot
2. Set Primary Guild to server with DLSA tag
3. Check console logs

**Expected Result**:
- ✅ No role assigned (bot lacks permission)
- ✅ Console shows warning (not error)
- ✅ Bot continues functioning normally

---

## Troubleshooting

### Issue: Role not assigned

**Checklist**:
- [ ] Bot has "Manage Roles" permission
- [ ] Bot's role is above tag role
- [ ] Tag role is configured via `/config`
- [ ] Primary Guild tag is exactly "DLSA"
- [ ] User is a member of the server
- [ ] Bot is online and running

### Issue: Role not removed

**Checklist**:
- [ ] Primary Guild was actually changed
- [ ] Bot received the UserUpdate event
- [ ] Check console logs for errors
- [ ] Verify bot has permission to remove role

### Common Errors

- `Missing Permissions` → Check bot permissions
- `Unknown Role` → Role was deleted
- `Unknown Member` → User left the server
- `Hierarchy` → Bot's role is too low

---

## Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| Test 1: Basic Tag Detection | ⬜ | |
| Test 2: Tag Removal | ⬜ | |
| Test 3: Case Insensitivity | ⬜ | |
| Test 4: Multiple Guilds | ⬜ | |
| Test 5: Permission Handling | ⬜ | |

**Overall Status**: ⬜ Not Started / 🟡 In Progress / ✅ Passed / ❌ Failed

**Tested By**: _____________

**Date**: _____________

