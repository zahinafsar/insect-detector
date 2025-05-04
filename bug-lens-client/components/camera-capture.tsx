"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, FlipHorizontal, Aperture, Check, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void
  onCancel: () => void
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Debug logging
  console.log("CameraCapture rendering with states:", {
    showPreview,
    capturedImage: capturedImage ? "exists" : "null",
    stream: stream ? "active" : "null",
    isCapturing,
  })

  useEffect(() => {
    if (!showPreview) {
      startCamera()
    }

    // Cleanup function to stop camera when component unmounts
    return () => {
      stopAllTracks()
    }
  }, [facingMode, showPreview])

  const stopAllTracks = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop()
        console.log("Camera track stopped:", track.kind, track.readyState)
      })
      setStream(null)
    }
  }

  const startCamera = async () => {
    try {
      // Stop any existing tracks first
      stopAllTracks()

      setCameraError(null)
      console.log("Starting camera with facing mode:", facingMode)

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      setStream(newStream)
      console.log("Camera started successfully")

      if (videoRef.current) {
        videoRef.current.srcObject = newStream
        videoRef.current.onloadedmetadata = () => {
          console.log(
            "Video metadata loaded, video dimensions:",
            videoRef.current?.videoWidth,
            videoRef.current?.videoHeight,
          )
        }
        console.log("Video element updated with new stream")
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setCameraError("Could not access camera. Please ensure you've granted camera permissions.")
    }
  }

  const captureImage = () => {
    if (!videoRef.current) {
      console.error("Video ref is null")
      return
    }

    if (!canvasRef.current) {
      console.error("Canvas ref is null")
      return
    }

    try {
      setIsCapturing(true)
      console.log("Capturing image...")

      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (!context) {
        console.error("Could not get canvas context")
        return
      }

      // Make sure video has dimensions before capturing
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.error("Video dimensions are zero. Video might not be ready.")
        setIsCapturing(false)
        return
      }

      console.log("Video dimensions:", video.videoWidth, video.videoHeight)

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Clear the canvas first
      context.clearRect(0, 0, canvas.width, canvas.height)

      // Draw the current video frame to the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Get the image data URL
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9)
      console.log("Image captured successfully, length:", imageDataUrl.length)

      // Stop all tracks
      stopAllTracks()

      // Show preview with the captured image
      setCapturedImage(imageDataUrl)
      setShowPreview(true)
      setIsCapturing(false)
      console.log("Preview should be showing now")
    } catch (error) {
      console.error("Error capturing image:", error)
      setIsCapturing(false)
    }
  }

  const handleSubmit = () => {
    if (capturedImage) {
      console.log("Submitting captured image")
      onCapture(capturedImage)
    }
  }

  const handleRetake = () => {
    console.log("Retaking photo")
    setCapturedImage(null)
    setShowPreview(false)
    // Camera will restart due to useEffect dependency on showPreview
  }

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
  }

  const handleCancel = () => {
    console.log("Camera cancelled, stopping all tracks")
    stopAllTracks()
    onCancel()
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-4">
        {showPreview && capturedImage ? (
          // Preview mode
          <div className="relative w-full h-full">
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <p className="text-white text-lg">Loading preview...</p>
            </div>
            <Image
              src={capturedImage || "/placeholder.svg"}
              alt="Captured photo"
              fill
              className="object-cover"
              onError={(e) => console.error("Image failed to load:", e)}
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full w-12 h-12 bg-white/20 backdrop-blur-sm border-white/50 text-white hover:bg-white/30"
                  onClick={handleRetake}
                >
                  <RefreshCw className="h-6 w-6" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="relative">
                <Button
                  size="icon"
                  className="rounded-full w-16 h-16 bg-white text-emerald-600 hover:bg-white/90 border-4 border-emerald-500"
                  onClick={handleSubmit}
                >
                  <Check className="h-8 w-8" />
                </Button>
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-white"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                ></motion.div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full w-12 h-12 bg-white/20 backdrop-blur-sm border-white/50 text-white hover:bg-white/30"
                  onClick={handleCancel}
                >
                  <X className="h-6 w-6" />
                </Button>
              </motion.div>
            </div>
          </div>
        ) : cameraError ? (
          // Error state
          <div className="absolute inset-0 flex items-center justify-center text-white bg-black p-4 text-center">
            <div>
              <p className="mb-4">{cameraError}</p>
              <Button onClick={startCamera} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          // Camera view
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
            />

            {isCapturing && <div className="absolute inset-0 bg-white animate-flash"></div>}

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full w-12 h-12 bg-white/20 backdrop-blur-sm border-white/50 text-white hover:bg-white/30"
                  onClick={handleCancel}
                >
                  <X className="h-6 w-6" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="relative">
                <Button
                  size="icon"
                  className="rounded-full w-16 h-16 bg-white text-emerald-600 hover:bg-white/90 border-4 border-emerald-500"
                  onClick={captureImage}
                >
                  <Aperture className="h-8 w-8" />
                </Button>
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-white"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                ></motion.div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full w-12 h-12 bg-white/20 backdrop-blur-sm border-white/50 text-white hover:bg-white/30"
                  onClick={toggleCamera}
                >
                  <FlipHorizontal className="h-6 w-6" />
                </Button>
              </motion.div>
            </div>
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
