// Face recognition utilities using face-api.js
// These are client-side functions that run in the browser

let modelsLoaded = false
let modelsLoadFailed = false
let loadingPromise: Promise<boolean> | null = null

async function loadModels(): Promise<boolean> {
  if (modelsLoaded) return true
  if (modelsLoadFailed) return false
  if (loadingPromise) return loadingPromise
  
  loadingPromise = (async () => {
    try {
      // Dynamically import face-api.js
      const faceapi = await import('face-api.js')
      
      // Load models from CDN (more reliable than hosting locally)
      // You can also use '/models' if you download models to public/models/
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ])
      
      modelsLoaded = true
      return true
    } catch (error) {
      console.error('Error loading face-api models:', error)
      modelsLoadFailed = true
      return false
    }
  })()
  
  return loadingPromise
}

export async function detectFace(image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) {
  try {
    const modelsAvailable = await loadModels()
    if (!modelsAvailable) {
      console.warn('Face detection models not available')
      return null
    }
    
    const faceapi = await import('face-api.js')
    
    // Check if models are actually loaded
    if (!faceapi.nets.tinyFaceDetector.isLoaded) {
      console.warn('TinyFaceDetector model not loaded')
      return null
    }
    
    const detection = await faceapi
      .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor()
    
    return detection
  } catch (error) {
    console.error('Error detecting face:', error)
    return null
  }
}

export async function detectFaceWithDetails(image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) {
  try {
    const modelsAvailable = await loadModels()
    if (!modelsAvailable) {
      console.warn('Face detection models not available')
      return null
    }
    
    const faceapi = await import('face-api.js')
    
    // Check if models are actually loaded
    if (!faceapi.nets.tinyFaceDetector.isLoaded) {
      console.warn('TinyFaceDetector model not loaded')
      return null
    }
    
    const detection = await faceapi
      .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor()
    
    return detection
  } catch (error) {
    console.error('Error detecting face with details:', error)
    return null
  }
}

export async function compareFaces(
  descriptor1: Float32Array | null,
  descriptor2: Float32Array | null,
  threshold: number = 0.6
): Promise<{ match: boolean; accuracy: number }> {
  try {
    if (!descriptor1 || !descriptor2) {
      return { match: false, accuracy: 0 }
    }
    
    const modelsAvailable = await loadModels()
    if (!modelsAvailable) {
      console.warn('Face comparison models not available')
      return { match: false, accuracy: 0 }
    }
    
    const faceapi = await import('face-api.js')
    
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2)
    const accuracy = Math.max(0, Math.min(100, (1 - distance) * 100))
    const match = distance < threshold
    
    return { match, accuracy }
  } catch (error) {
    console.error('Error comparing faces:', error)
    return { match: false, accuracy: 0 }
  }
}


