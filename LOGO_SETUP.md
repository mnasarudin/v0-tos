# How to Change the Homepage Logo

## Step 1: Add Your Logo File

1. Place your logo image file in the `public` folder
2. Supported formats: `.png`, `.jpg`, `.jpeg`, `.svg`
3. Recommended size: 48x48 pixels or larger (square format works best)
4. Recommended filename: `logo.png` or `company-logo.png`

## Step 2: Update the Code

The logo is referenced in `app/page.tsx` at line 116.

Simply replace the filename in the `src` attribute:

```tsx
<Image 
  src="/your-logo-filename.png"  // Change this to your logo filename
  alt="Your Company Logo" 
  width={48} 
  height={48} 
  className="object-contain rounded-full"
  onError={(e) => {
    e.currentTarget.style.display = 'none';
  }}
/>
```

## Example

If your logo file is named `my-company-logo.png`:

1. Copy `my-company-logo.png` to the `public` folder
2. Update line 116 in `app/page.tsx` to:
   ```tsx
   src="/my-company-logo.png"
   ```

## Notes

- The logo will be displayed as a 48x48 pixel rounded circle
- If the image fails to load, it will hide automatically and show the text-based fallback
- Make sure your logo has a transparent background or looks good on the blue background

