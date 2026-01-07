# Email Setup Guide - Gmail Configuration

This guide will help you set up email sending for the Intern Attendance System using Gmail.

## Prerequisites
- A Gmail account
- Access to your Google Account settings

## Step 1: Enable 2-Step Verification

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Under "Signing in to Google", find **2-Step Verification**
4. Click on it and follow the prompts to enable 2-Step Verification
   - You'll need to verify your phone number
   - You may need to enter a verification code sent to your phone

## Step 2: Generate an App Password

1. Still in your Google Account Security settings
2. Look for **App passwords** (it should appear after enabling 2-Step Verification)
   - If you don't see it, go directly to: https://myaccount.google.com/apppasswords
3. You may need to sign in again
4. Under "Select app", choose **Mail**
5. Under "Select device", choose **Other (Custom name)**
6. Enter a name like "Intern Attendance System" or "v0-tos"
7. Click **Generate**
8. **IMPORTANT:** Copy the 16-character password that appears (it will look like: `abcd efgh ijkl mnop`)
   - You won't be able to see this password again!
   - Remove the spaces when using it (so it becomes: `abcdefghijklmnop`)

## Step 3: Set Environment Variables

### Option A: Using a `.env.local` file (Recommended for Development)

1. In your project root directory (`/Users/wanadiba/v0-tos`), create or edit `.env.local` file
2. Add these lines:
   ```
   GMAIL_USER=your-email@gmail.com
   GMAIL_PASS=abcdefghijklmnop
   ```
   Replace:
   - `your-email@gmail.com` with your actual Gmail address
   - `abcdefghijklmnop` with the App Password you generated (without spaces)

3. Save the file

### Option B: Using System Environment Variables (For Production)

If you're using PM2 or a production server:

1. Edit your PM2 ecosystem file or server startup script
2. Add the environment variables:
   ```bash
   GMAIL_USER=your-email@gmail.com
   GMAIL_PASS=abcdefghijklmnop
   ```

### Option C: Export in Terminal (Temporary - for testing)

```bash
export GMAIL_USER="your-email@gmail.com"
export GMAIL_PASS="abcdefghijklmnop"
```

## Step 4: Restart Yo
ur Development Server

After setting the environment variables, restart your Next.js server:

1. Stop the current server (Ctrl+C in the terminal where it's running)
2. Start it again:
   ```bash
   npm run dev
   ```

If using PM2:
```bash
pm2 restart all
```

## Step 5: Test Email Sending

1. Go to the signup page: http://localhost:3000/signup
2. Fill out the signup form with a valid email address
3. Submit the form
4. Check:
   - Your email inbox (and spam folder) for the verification code
   - The server console for success messages like "✅ Email sent successfully!"
   - The verification code should NOT appear on the page if email was sent successfully

## Troubleshooting

### Email not sending?

1. **Check environment variables are loaded:**
   - Add a temporary log in `lib/email.ts` to verify variables are set
   - Or check server logs for "Email credentials not configured" warning

2. **Verify App Password:**
   - Make sure you're using the App Password, not your regular Gmail password
   - Ensure there are no extra spaces in the password

3. **Check Gmail security:**
   - Make sure 2-Step Verification is enabled
   - Try generating a new App Password

4. **Check server logs:**
   - Look for error messages in the console
   - Common errors:
     - "Invalid login" - Wrong password or email
     - "Less secure app access" - Need to use App Password, not regular password
     - "Connection timeout" - Network/firewall issue

5. **Test with a simple email:**
   - Try sending to your own email first
   - Check spam/junk folder

### Still having issues?

Check the server console logs for detailed error messages. The email function will log:
- ✅ Success messages when emails are sent
- ❌ Error messages with details if sending fails

## Security Notes

- **Never commit `.env.local` to git** - It's already in `.gitignore`
- **App Passwords are safer** than using your regular password
- **Each App Password is unique** - You can revoke it anytime from Google Account settings
- **Use different App Passwords** for different applications

## Example `.env.local` file

```
GMAIL_USER=langkawiport.interns@gmail.com
GMAIL_PASS=abcd efgh ijkl mnop
```

Remember: Remove spaces from the App Password when pasting it!

