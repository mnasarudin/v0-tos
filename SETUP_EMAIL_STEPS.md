# Quick Email Setup Steps

Follow these steps to enable email sending for verification codes:

## Step 1: Get Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Sign in if needed
3. Select:
   - **App:** Mail
   - **Device:** Other (Custom name) → Enter "Intern System"
4. Click **Generate**
5. **Copy the 16-character password** (remove spaces when using it)
   - Example: `abcd efgh ijkl mnop` → use as `abcdefghijklmnop`

## Step 2: Add to Environment File

Open `.env.local` in your project and add:

```bash
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password-here
```

**Important:**
- Replace `your-email@gmail.com` with your actual Gmail
- Replace `your-app-password-here` with the App Password (no spaces)
- Make sure 2-Step Verification is enabled on your Google account first

## Step 3: Restart Server

Stop and restart your development server:

```bash
# Stop current server (Ctrl+C)
npm run dev
```

## Step 4: Test

1. Go to http://localhost:3000/signup
2. Fill out the form with a real email
3. Submit
4. Check the email inbox for the verification code

**Success indicators:**
- ✅ Server logs show "Email sent successfully!"
- ✅ Verification code appears in email (not on the page)
- ✅ No yellow "Email Not Sent" box appears

## Need Help?

If you see "Email credentials not configured":
- Check `.env.local` file exists and has both variables
- Make sure variable names are exactly: `GMAIL_USER` and `GMAIL_PASS`
- Restart the server after adding variables

If emails don't arrive:
- Check spam/junk folder
- Verify App Password is correct (no spaces)
- Make sure 2-Step Verification is enabled
- Check server logs for error messages

