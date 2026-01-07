# Face Detection Models Setup Guide

## The Issue
Face detection isn't working because the face-api.js model files are missing. This is **NOT** a localhost vs HTTPS issue - the models simply need to be downloaded and placed in your project.

## Will it work in production?
**YES!** Once you add the models to your project, they will work the same on:
- ✅ localhost (http://localhost:3000)
- ✅ Production (https://yourdomain.com)
- ✅ Any environment

The models are just static files that get served by your web server, just like images or CSS files.

## How to Fix

### Option 1: Download Models Manually (Recommended)

1. **Download the models from GitHub:**
   - Go to: https://github.com/justadudewhohacks/face-api.js-models
   - Or use this direct link: https://github.com/justadudewhohacks/face-api.js-models/tree/master/weights

2. **Download these 3 model files:**
   - `tiny_face_detector_model-weights_manifest.json`
   - `tiny_face_detector_model-shard1` (binary file)
   - `face_landmark_68_model-weights_manifest.json`
   - `face_landmark_68_model-shard1` (binary file)
   - `face_recognition_model-weights_manifest.json`
   - `face_recognition_model-shard1` (binary file)

3. **Place them in:** `public/models/` directory

### Option 2: Use a CDN (Alternative)

If you don't want to host the models yourself, you can load them from a CDN by updating `lib/face-recognition.ts`:

```typescript
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
```

### Option 3: Use npm package (Easiest)

```bash
npm install @vladmandic/face-api
```

Then update the model loading path in `lib/face-recognition.ts`.

## Quick Setup Script

Run this in your terminal:

```bash
cd /Users/wanadiba/v0-tos
mkdir -p public/models
cd public/models

# Download models using curl
curl -L -o tiny_face_detector_model-weights_manifest.json https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/weights/tiny_face_detector_model-weights_manifest.json
curl -L -o face_landmark_68_model-weights_manifest.json https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/weights/face_landmark_68_model-weights_manifest.json
curl -L -o face_recognition_model-weights_manifest.json https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/weights/face_recognition_model-weights_manifest.json

# Download shard files (these are binary)
curl -L -o tiny_face_detector_model-shard1 https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/weights/tiny_face_detector_model-shard1
curl -L -o face_landmark_68_model-shard1 https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/weights/face_landmark_68_model-shard1
curl -L -o face_recognition_model-shard1 https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/weights/face_recognition_model-shard1
```

## Verify Setup

After adding the models, restart your dev server and try capturing a photo again. You should see:
- ✅ No 404 errors in the console
- ✅ Face detection working
- ✅ No "models not available" message

## File Structure

Your `public/models/` directory should look like:
```
public/
  models/
    tiny_face_detector_model-weights_manifest.json
    tiny_face_detector_model-shard1
    face_landmark_68_model-weights_manifest.json
    face_landmark_68_model-shard1
    face_recognition_model-weights_manifest.json
    face_recognition_model-shard1
```

## Production Deployment

When you deploy to production:
1. The models in `public/models/` will be automatically included
2. They'll be served from `/models/` just like on localhost
3. No additional configuration needed!

The models are just static files - they work the same everywhere.

