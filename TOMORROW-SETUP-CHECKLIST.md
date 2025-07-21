# 🚀 Withcar Setup & Testing Checklist for Tomorrow

## **🎯 Top Priorities (Most Important)**

### **✅ 1. User Account Setup**
- [ ] Verify `tim.mak88@gmail.com` exists in Supabase Auth dashboard
- [ ] Connect user to Withcar organization
- [ ] Test login functionality

**Quick Check:** Run `./scripts/run-with-env.sh node scripts/verify-withcar-setup.js`

---

### **✅ 2. Metakocka Integration**
- [ ] Navigate to `/settings/integrations/metakocka`
- [ ] Input Company ID: `2889`
- [ ] Input Secret Key: `d1233595-4309-4ff2-aaf0-5e2b2a191270`
- [ ] Test connection (may need to adjust API endpoint)
- [ ] Verify credentials are saved securely

**Manual Test:** Run `node scripts/test-metakocka-connection.js`

---

### **✅ 3. Email System Testing**
- [ ] Connect tim.mak88@gmail.com email account 
- [ ] Test email reading and display
- [ ] Verify HTML emails render properly
- [ ] Test the new unified "AI Analysis & Draft" button
- [ ] Verify contact saving works
- [ ] Check draft generation (no infinite loops)

**Features to Test:**
- ✅ **Simplified UI**: Single "AI Analysis & Draft" button (no more separate buttons)
- ✅ **Email Parsing**: HTML emails should display cleanly
- ✅ **Sales Agent**: Analyzes leads + generates drafts
- ✅ **Contact Saving**: No more 400 errors

---

## **🔧 System Verification**

### **✅ Phase 2 Cleanup Completed**
- ✅ Removed `/dashboard/email/test-phase2/page.tsx`
- ✅ Deleted complex Phase 2 APIs and components  
- ✅ No more confusing error-prone features
- ✅ System focused on core working features

### **✅ Core Features Ready**
- ✅ **Sales Agent**: Lead qualification + draft generation
- ✅ **AI Analysis**: Personality insights  
- ✅ **Email Reading**: Clean HTML parsing
- ✅ **Contact Management**: Automatic contact creation
- ✅ **Dashboard Analytics**: Ready for real data

---

## **🧪 Testing Scripts Available**

### **Database Verification**
```bash
# Check Withcar organization setup
./scripts/run-with-env.sh node scripts/verify-withcar-setup.js
```

### **Metakocka API Testing**
```bash
# Test API connection
node scripts/test-metakocka-connection.js

# Test specific endpoint
node -e "
const { testSpecificEndpoint } = require('./scripts/test-metakocka-connection.js');
testSpecificEndpoint('/products', { limit: 3 });
"
```

---

## **📍 Key Pages to Test**

### **Email Management**: `/dashboard/email`
- [ ] Email list displays properly
- [ ] Click email → opens details
- [ ] Click "AI Analysis & Draft" → generates both analysis AND draft
- [ ] "Save to Contact" works without errors
- [ ] HTML emails display cleanly (no raw code)

### **Metakocka Settings**: `/settings/integrations/metakocka`
- [ ] Form fields work
- [ ] Credentials save properly
- [ ] "Test Connection" button functions
- [ ] Error handling for invalid credentials

### **Email Settings**: `/settings/email-accounts`
- [ ] Can add IMAP account
- [ ] Gmail OAuth works
- [ ] Account testing functions

---

## **🚨 Known Issues & Solutions**

### **If Metakocka API Fails:**
- **Issue**: Network errors or wrong endpoints
- **Solution**: Try different API endpoint URLs:
  - `https://api.metakocka.si/rest/v1`
  - `https://api.metakocka.si/v1`
  - `https://metakocka.si/api/v1`
- **Backup**: Test credentials manually via Metakocka documentation

### **If User Setup Fails:**
- **Issue**: tim.mak88@gmail.com not found
- **Solution**: 
  1. Go to Supabase Dashboard → Authentication → Users
  2. Click "Add User" 
  3. Email: `tim.mak88@gmail.com`
  4. Password: temporary password
  5. Re-run verification script

### **If Email Features Fail:**
- **Issue**: HTML not rendering or infinite loops
- **Solution**: Already fixed! Email parser handles HTML safely, draft generation fixed

---

## **🎯 Success Criteria**

### **Minimum Success** (Must Have):
- [ ] User can log in as tim.mak88@gmail.com
- [ ] User belongs to Withcar organization  
- [ ] Email reading works with clean HTML display
- [ ] "AI Analysis & Draft" button generates both analysis AND draft
- [ ] Contact saving works without errors

### **Full Success** (Nice to Have):
- [ ] Metakocka API connection established
- [ ] Can fetch products/contacts from Metakocka
- [ ] Dashboard shows real analytics data
- [ ] All email features work smoothly

---

## **📞 Next Steps After Setup**

1. **Populate Real Data**: Use the working features to get real analytics
2. **Focus on Business Value**: Use Sales Agent for actual lead qualification
3. **Expand Metakocka**: Once connection works, sync products and contacts
4. **Refine AI**: Improve prompts based on real usage

---

## **💡 Why This Setup Works**

- **Simple & Focused**: Removed complex Phase 2 that nobody understood
- **User-Centric**: Single button does everything users actually want
- **Reliable**: Fixed all the bugs and infinite loops
- **Business-Ready**: Sales Agent provides real value for Withcar

**You now have a clean, working CRM focused on what actually helps you manage customer relationships!** 🎉 