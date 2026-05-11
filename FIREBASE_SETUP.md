# Firebase Setup Guide for Phone Authentication

## 🚨 **URGENT FIX NEEDED: INVALID_APP_CREDENTIAL Error**

You're getting this error because Phone Authentication is not properly configured. Follow these exact steps:

## ✅ **IMMEDIATE ACTION REQUIRED**

### Step 1: Enable Phone Authentication (CRITICAL)
1. **Open:** [Firebase Console](https://console.firebase.google.com/)
2. **Select:** Your project **spicecraftbir**
3. **Click:** **Authentication** (left sidebar)
4. **Click:** **Sign-in method** tab
5. **Find:** **Phone** in the providers list
6. **Click:** on **Phone** row
7. **Toggle:** **Enable** to **ON** ✅
8. **Click:** **Save**

**⚠️ This is the #1 cause of INVALID_APP_CREDENTIAL error**

### Step 2: Add Authorized Domains (CRITICAL)
1. **Still in Authentication:** Click **Settings** tab
2. **Scroll down to:** **Authorized domains**
3. **Verify these domains exist:**
   - ✅ `localhost` 
   - ✅ `spicecraftbir.firebaseapp.com`
4. **If missing, click:** **Add domain**
5. **Add:** `localhost`
6. **Click:** **Done**

**⚠️ Without localhost, you'll get reCAPTCHA errors**

### Step 3: Add Test Phone Number (RECOMMENDED)
1. **In Authentication → Settings**
2. **Scroll to:** **Phone numbers for testing**
3. **Click:** **Add phone number**
4. **Enter:**
   - Phone: `+918084350810` (your number from the error log)
   - Code: `123456`
5. **Click:** **Done**

**💡 This bypasses SMS and uses a fixed OTP for testing**

## 🔥 **IMMEDIATE TEST STEPS:**

After completing Steps 1-3:

1. **Clear browser cache:** Ctrl+Shift+Delete → Clear all
2. **Refresh your app:** F5
3. **Open dev tools:** F12 → Console tab
4. **Try login with:** `+91 8084350810`
5. **Use OTP:** `123456` (if you added test number)

## � **Expected Behavior:**
- ✅ No INVALID_APP_CREDENTIAL error
- ✅ "OTP sent successfully" message
- ✅ Can enter OTP and login

## 🚨 **If Still Getting INVALID_APP_CREDENTIAL:**

### Check API Key Restrictions (Advanced)
1. **Go to:** [Google Cloud Console](https://console.cloud.google.com/)
2. **Select:** **spicecraftbir** project
3. **Navigate:** APIs & Services → Credentials
4. **Find:** API key starting with `AIzaSyAJMTQV3ymdqiZWd-MQ3Aq51uuQeotbZGQ`
5. **Click:** the API key
6. **Check:** Application restrictions
7. **Should be:** "None" or include your domain
8. **Check:** API restrictions
9. **Should include:** "Identity Toolkit API"

### Alternative: Create New API Key
1. **In Google Cloud Console → Credentials**
2. **Click:** **+ CREATE CREDENTIALS** → **API key**
3. **Copy** the new key
4. **Replace** in your `.env.local` file:
   ```
   VITE_FIREBASE_API_KEY=your_new_api_key_here
   ```

## 🎯 **Most Likely Solution:**
**90% of INVALID_APP_CREDENTIAL errors are fixed by Step 1 (enabling Phone auth)**

## � **Still Need Help?**
1. **Screenshot** the Firebase Console Authentication page
2. **Share** any new error messages from browser console
3. **Confirm** you completed Step 1 (Phone auth enabled)