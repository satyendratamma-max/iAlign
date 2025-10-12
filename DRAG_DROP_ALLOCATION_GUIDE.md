# Drag & Drop Allocation - Quick Start Guide

## 🎯 Simple Workflow

Both Timeline and Kanban views now support **instant allocation** with drag-and-drop. No dialogs, no forms - just drag, drop, and done!

---

## ⚡ How It Works

### **Automatic Defaults:**
- ✅ **Duration**: Matches full project timeline
- ✅ **Allocation**: 100% by default
- ✅ **Type**: Shared allocation
- ✅ **Skills**: Automatically matched to best capability/requirement

### **Result:**
- Instant allocation creation
- Success notification appears
- Data refreshes automatically
- Edit later if you need different values

---

## 🖱️ Timeline View Usage

### **Step-by-Step:**
1. Find a project in the **"Available Projects"** pool (bottom)
2. **Drag** the project card
3. **Drop** it on any resource row
4. ✅ Done! Success message appears

### **What Happens:**
```
Project "Website Redesign" → Dropped on "John Doe"

System automatically creates:
- Resource: John Doe
- Project: Website Redesign
- Duration: Full project (Jan 2025 - Jun 2025)
- Allocation: 100%
- Type: Shared
- Skills: Auto-matched (e.g., React Developer → React Developer Need)
```

### **Visual Feedback:**
- Green notification = Success
- Red notification = Error (check console for details)
- Allocation bar appears immediately on timeline
- Project moves out of "Available Projects" pool

---

## 🎴 Kanban View Usage

### **3 Ways to Allocate:**

#### **Method 1: Resource → Project Card**
1. Drag resource card from left
2. Drop directly on specific project card (right)
3. ✅ Done!

#### **Method 2: Project → Resource Card**
1. Drag project card from right
2. Drop directly on specific resource card (left/middle)
3. ✅ Done!

#### **Method 3: Card → Column**
1. Drag resource to "Projects Needing Resources" column
2. System picks first available project
3. ✅ Done!

   OR

1. Drag project to "Available Resources" column
2. System picks first available resource
3. ✅ Done!

### **Visual Feedback:**
- Green notification = Success
- Cards update immediately
- Resource moves to "Allocated Resources" column
- Project requirement counts update

---

## 🛠️ Post-Allocation Editing

If you need to change allocation details after drag-and-drop:

### **From Timeline View:**
1. Hover over allocation bar
2. Click **Edit icon** (pencil)
3. Opens full edit dialog with all options
4. Modify as needed

### **From Table View:**
1. Switch to "Table View" tab
2. Find the allocation row
3. Click **Edit icon** (pencil)
4. Opens full edit dialog
5. Change percentage, duration, type, skills, etc.

### **From Timeline View (Delete):**
1. Hover over allocation bar
2. Click **Delete icon** (trash)
3. Confirms deletion

---

## 🤖 Automatic Skill Matching

The system intelligently matches skills:

### **Perfect Match:**
```
Resource Capability: SAP/ABAP/Developer - Expert
Project Requirement: SAP/ABAP/Developer - Expert

✅ Perfect match! Auto-linked.
```

### **No Perfect Match:**
```
Resource Capability: React/TypeScript/Frontend - Senior
Project Requirement: Angular/JavaScript/Frontend - Mid

⚠️ No exact match
→ System uses resource's PRIMARY capability
→ Links to first project requirement
→ You can edit manually later
```

### **No Skills Available:**
```
Resource has no capabilities OR Project has no requirements

→ Allocation created without skill linkage
→ Still valid, just no match score
→ Add skills manually later if needed
```

---

## 📝 Common Scenarios

### **Scenario 1: Allocate at 50%**
**Problem:** Drag-and-drop creates 100% allocation, but I need 50%

**Solution:**
1. Let drag-and-drop create the allocation (100%)
2. Click Edit on the allocation bar
3. Change to 50%
4. Save

### **Scenario 2: Different Duration**
**Problem:** I need custom dates, not full project duration

**Solution:**
1. Let drag-and-drop create the allocation
2. Click Edit on the allocation bar
3. Uncheck "Use full project duration"
4. Set custom start/end dates
5. Save

### **Scenario 3: Change Allocation Type**
**Problem:** Need "Dedicated" instead of "Shared"

**Solution:**
1. Let drag-and-drop create the allocation
2. Click Edit on the allocation bar
3. Change type to "Dedicated"
4. Save

### **Scenario 4: Wrong Skill Match**
**Problem:** System matched wrong capability/requirement

**Solution:**
1. Let drag-and-drop create the allocation
2. Click Edit on the allocation bar
3. Change capability dropdown
4. Change requirement dropdown
5. Save

---

## ⚠️ Error Handling

### **Common Errors:**

**"Failed to create allocation"**
- Check if scenarioId is valid
- Ensure project has start/end dates
- Verify resource exists in the scenario
- Check browser console for details

**"No active scenario"**
- Make sure you've selected a scenario
- Check scenario dropdown at top of page

**"Resource not found"**
- Resource may have been deleted
- Refresh the page (F5)

**"Project not found"**
- Project may belong to different scenario
- Check filters are not too restrictive
- Refresh the page (F5)

---

## 💡 Pro Tips

✅ **Speed Tip:** Use Timeline View for quick visual planning, then switch to Table View for detailed review

✅ **Accuracy Tip:** Check skill cards on resources/projects before dragging to ensure good matches

✅ **Capacity Tip:** Watch the capacity chips - green means available, red means over-allocated

✅ **Bulk Allocation Tip:** Drag multiple projects to the same resource quickly - the system handles it

✅ **Undo Tip:** If you make a mistake, just delete the allocation and try again (no limit!)

✅ **Workflow Tip:**
1. Use Kanban for high-level "who's working on what"
2. Use Timeline for scheduling and duration planning
3. Use Table for detailed analysis and bulk edits

---

## 🔄 Workflow Comparison

| Task | Old Way (Form) | New Way (Drag & Drop) |
|------|----------------|------------------------|
| Allocate resource | 1. Click "Add Allocation"<br>2. Select resource<br>3. Select project<br>4. Set percentage<br>5. Set dates<br>6. Select skills<br>7. Click Save | 1. Drag project to resource<br>2. Done! |
| Time to allocate | ~30 seconds | ~2 seconds |
| Clicks required | 7+ clicks | 1 drag |
| Visual feedback | None until save | Immediate |
| Skill matching | Manual selection | Automatic |

---

## 🎓 Best Practices

### **Before Allocating:**
1. Review project requirements (right-click to view details)
2. Check resource skills and capacity
3. Verify project timeline makes sense

### **While Allocating:**
1. Drag smoothly - don't drop too quickly
2. Look for color indicators (green = good match)
3. Wait for success notification before next drag

### **After Allocating:**
1. Check the allocation appears correctly
2. Verify capacity indicators update
3. Switch to Table View if you need to make adjustments

---

## 🚀 Quick Start Checklist

- [ ] Select active scenario
- [ ] Open Resource Allocation page
- [ ] Switch to Timeline or Kanban view
- [ ] Find resource with available capacity (green chip)
- [ ] Find project in available pool
- [ ] Drag project → Drop on resource
- [ ] Wait for green success notification
- [ ] Verify allocation appears
- [ ] Edit if needed (optional)
- [ ] Repeat!

---

## 🆘 Troubleshooting

**Drag doesn't work:**
- Check if you're clicking and holding
- Make sure cursor shows "grab" icon
- Try refreshing the page

**Drop doesn't work:**
- Verify you're dropping in valid zone
- Check if zone highlights when hovering
- Try dropping on specific card vs column

**No success message:**
- Check browser console for errors
- Verify network connection
- Check if backend is running

**Allocation doesn't appear:**
- Wait 2-3 seconds for refresh
- Manually refresh data (F5)
- Check if filters are hiding it

---

**Happy Allocating! 🎉**

For more details, see the full [ALLOCATION_VIEWS_GUIDE.md](ALLOCATION_VIEWS_GUIDE.md)
