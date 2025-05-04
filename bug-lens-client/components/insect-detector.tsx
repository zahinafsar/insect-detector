"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  Upload,
  X,
  Camera,
  Download,
  RotateCcw,
  Maximize2,
  ChevronLeft,
  CheckCircle2,
  Aperture,
  Sparkles,
  Bug,
} from "lucide-react";
import Image from "next/image";
import LoadingAnimation from "@/components/loading-animation";
import { motion, AnimatePresence } from "framer-motion";
import { useMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import CameraCapture from "./camera-capture";

type AppState = "idle" | "camera" | "uploading" | "processing" | "result";

export default function InsectDetector() {
  useEffect(() => {
    document.title = "BugLens - AI Insect Identification";
  }, []);
  const [appState, setAppState] = useState<AppState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMobile();
  const { toast } = useToast();

  // Debug logging
  useEffect(() => {
    console.log("Current app state:", appState);
  }, [appState]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    console.log("Image captured from camera, processing...");
    setSelectedImage(imageDataUrl);
    setAppState("uploading");
    setUploadProgress(0);

    // Convert data URL to file
    fetch(imageDataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], "camera-capture.jpg", {
          type: "image/jpeg",
        });
        console.log(
          "Camera image converted to file, starting upload simulation"
        );
        simulateUploadAndProcessing();
      })
      .catch((error) => {
        console.error("Error processing camera image:", error);
        toast({
          title: "Error",
          description:
            "Failed to process the captured image. Please try again.",
          variant: "destructive",
        });
        resetState();
      });
  };

  const processSelectedFile = (file: File) => {
    // Reset state
    setAppState("uploading");
    setUploadProgress(0);

    // Create a URL for the selected image
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);

    simulateUploadAndProcessing();
  };

  const simulateUploadAndProcessing = () => {
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setAppState("processing");

          // Simulate processing time
          setTimeout(() => {
            // In a real app, this would be the result from your API
            setResultImage("/placeholder.svg?height=600&width=800");
            setAppState("result");

            toast({
              title: "Insect Identified!",
              description:
                "We've identified a Monarch Butterfly in your image.",
              variant: "success",
            });
          }, 3000);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const resetState = () => {
    console.log("Resetting application state to idle");

    // If we're in camera mode, make sure to tell the camera component to clean up
    if (appState === "camera") {
      console.log("Exiting camera mode, camera resources should be cleaned up");
      // The camera component will handle stopping tracks in its cleanup
    }

    setAppState("idle");
    setUploadProgress(0);
    setSelectedImage(null);
    setResultImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadResult = () => {
    if (resultImage) {
      const link = document.createElement("a");
      link.href = resultImage;
      link.download = "detected-insect.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Image Downloaded",
        description: "Your identified insect image has been downloaded.",
      });
    }
  };

  const openCamera = () => {
    console.log("Opening camera view");
    // Check if camera is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Camera Not Supported",
        description:
          "Your browser doesn't support camera access. Please try uploading an image instead.",
        variant: "destructive",
      });
      return;
    }

    setAppState("camera");
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <div className="flex flex-col items-center">
      <AnimatePresence mode="wait">
        {appState === "idle" && (
          <motion.div
            key="idle"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full"
          >
            <Card
              className="w-full max-w-2xl mx-auto p-6 border-0 bg-white/90 dark:bg-black/60 backdrop-blur-sm rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  className="size-24 mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Bug className="size-12 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2 text-emerald-800 dark:text-emerald-300">
                  Upload an Image
                </h2>
                <p className="text-emerald-600 dark:text-emerald-400 mb-8">
                  Drag and drop your image here or use one of the options below
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                  <motion.div
                    className="flex-1"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
                      size="lg"
                    >
                      <Upload className="mr-2 size-5" /> Browse Files
                    </Button>
                  </motion.div>
                  <motion.div
                    className="flex-1"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-emerald-950/50 shadow-md hover:shadow-lg transition-all duration-300"
                      size="lg"
                      onClick={openCamera}
                    >
                      <Camera className="mr-2 size-5" /> Take Photo
                    </Button>
                  </motion.div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {appState === "camera" && (
          <motion.div
            key="camera"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full"
          >
            <Card className="w-full max-w-2xl mx-auto p-4 border-0 bg-white/90 dark:bg-black/60 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="flex items-center mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetState}
                  className="text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                >
                  <ChevronLeft className="size-5" />
                </Button>
                <h2 className="text-xl font-semibold ml-2 text-emerald-800 dark:text-emerald-300">
                  Take a Photo
                </h2>
              </div>
              <CameraCapture
                onCapture={handleCameraCapture}
                onCancel={resetState}
              />
            </Card>
          </motion.div>
        )}

        {appState === "uploading" && (
          <motion.div
            key="uploading"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full"
          >
            <Card className="w-full max-w-2xl mx-auto p-6 border-0 bg-white/90 dark:bg-black/60 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="flex flex-col items-center">
                <h2 className="text-xl font-semibold mb-4 text-emerald-800 dark:text-emerald-300">
                  Uploading Image
                </h2>
                <div className="relative w-full max-w-md mb-6">
                  {selectedImage && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4 shadow-md">
                      <Image
                        src={selectedImage || "/placeholder.svg"}
                        alt="Selected insect"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-center justify-center">
                        <motion.div
                          className="text-white text-lg font-semibold px-4 py-2 rounded-full bg-emerald-500/80 backdrop-blur-sm"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          Uploading...
                        </motion.div>
                      </div>
                    </div>
                  )}
                  <Progress
                    value={uploadProgress}
                    className="h-2 bg-emerald-100 dark:bg-emerald-800"
                  />
                  <span className="block text-right mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                    {uploadProgress}%
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="mt-2 border-red-500 text-red-500 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950/50"
                  onClick={resetState}
                >
                  <X className="mr-2 size-4" /> Cancel
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {appState === "processing" && (
          <motion.div
            key="processing"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full"
          >
            <Card className="w-full max-w-2xl mx-auto p-6 border-0 bg-white/90 dark:bg-black/60 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="flex flex-col items-center">
                <motion.div
                  className="size-16 mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                >
                  <Aperture className="size-8 text-white" />
                </motion.div>
                <h2 className="text-xl font-semibold mb-2 text-emerald-800 dark:text-emerald-300">
                  Analyzing Insect
                </h2>
                <p className="text-emerald-600 dark:text-emerald-400 mb-6 text-center">
                  Our AI is working hard to identify the insect in your image
                </p>
                <div className="w-full max-w-md mb-6">
                  <LoadingAnimation />
                </div>
                <Button
                  variant="outline"
                  className="mt-2 border-red-500 text-red-500 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950/50"
                  onClick={resetState}
                >
                  <X className="mr-2 size-4" /> Cancel
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {appState === "result" && (
          <motion.div
            key="result"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full"
          >
            <Card className="w-full max-w-2xl mx-auto p-6 border-0 bg-white/90 dark:bg-black/60 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="flex flex-col items-center">
                <motion.div
                  className="flex items-center gap-2 mb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <CheckCircle2 className="size-6 text-emerald-500" />
                  <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">
                    Insect Identified!
                  </h2>
                </motion.div>

                <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-6 shadow-xl">
                  {resultImage && (
                    <div className="relative w-full h-full group">
                      <Image
                        src={resultImage || "/placeholder.svg"}
                        alt="Identified insect"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                        <div className="text-white text-xl font-bold">
                          Monarch Butterfly
                        </div>
                        <div className="text-white text-sm opacity-90 font-medium italic">
                          Danaus plexippus
                        </div>
                      </div>
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-md">
                        <div className="flex items-center gap-1">
                          <Sparkles className="size-3" />
                          <span>98% Match</span>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Button
                          variant="outline"
                          size="icon"
                          className="bg-white/20 backdrop-blur-sm border-white/50 text-white hover:bg-white/30"
                          onClick={() => {
                            // In a real app, this would open a fullscreen view
                            window.open(resultImage, "_blank");
                          }}
                        >
                          <Maximize2 className="size-5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <motion.div
                  className="w-full max-w-md mb-6 p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/40 rounded-xl shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="font-bold text-emerald-800 dark:text-emerald-300 mb-2 text-lg">
                    About this insect:
                  </h3>
                  <p className="text-emerald-700 dark:text-emerald-400">
                    The Monarch butterfly is known for its distinctive orange
                    and black wings. It's famous for its annual migration across
                    North America and is an important pollinator. These
                    butterflies can travel up to 3,000 miles during their
                    migration.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                      <span className="font-medium text-emerald-800 dark:text-emerald-300">
                        Habitat:
                      </span>
                      <span className="block text-emerald-600 dark:text-emerald-400">
                        Fields, meadows, gardens
                      </span>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                      <span className="font-medium text-emerald-800 dark:text-emerald-300">
                        Diet:
                      </span>
                      <span className="block text-emerald-600 dark:text-emerald-400">
                        Milkweed, nectar
                      </span>
                    </div>
                  </div>
                </motion.div>

                <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full max-w-md">
                  <motion.div
                    className="flex-1"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
                      onClick={downloadResult}
                    >
                      <Download className="mr-2 size-4" /> Download Result
                    </Button>
                  </motion.div>
                  <motion.div
                    className="flex-1"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-emerald-950/50 shadow-md hover:shadow-lg transition-all duration-300"
                      onClick={resetState}
                    >
                      <RotateCcw className="mr-2 size-4" /> Try Another
                    </Button>
                  </motion.div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
