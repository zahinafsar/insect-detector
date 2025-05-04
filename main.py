from fastapi import FastAPI, UploadFile, File, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import json
from pathlib import Path
import torch
import functools
import shutil
import base64

# Override torch.load to use weights_only=False by default
original_torch_load = torch.load
@functools.wraps(original_torch_load)
def custom_torch_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return original_torch_load(*args, **kwargs)
torch.load = custom_torch_load

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js development server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("model.pt")

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("temp")
PREDICT_DIR = Path("runs")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.get("/")
def root():
    return {"success": True}

@app.post("/predict")
async def upload(file: UploadFile = File(...)):
    try:
        # Create file path
        temp_filename = f"temp_{Path(file.filename)}"
        file_path = UPLOAD_DIR / temp_filename
        
        # Save the file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Detect image and get the result path
        result = model(file_path, save=True)
        result_path = Path(result[0].save_dir) / f"temp_{Path(file.filename).stem}.jpg"

        # Read the result image and convert to base64
        with open(result_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')

        # Extract detection results
        detections = []
        for r in result:
            boxes = r.boxes
            for box in boxes:
                detection = {
                    "class": r.names[int(box.cls[0])],
                    "confidence": float(box.conf[0]),
                    "bbox": box.xyxy[0].tolist()
                }
                detections.append(detection)

        # Clean up
        shutil.rmtree(PREDICT_DIR)
        file_path.unlink()
            
        return {
            "success": True,
            "detections": detections,
            "image": encoded_string
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
