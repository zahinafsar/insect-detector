from fastapi import FastAPI, UploadFile, File, HTTPException
from ultralytics import YOLO
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
model = YOLO("model.pt")

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("temp")
PREDICT_DIR = Path("runs")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.get("/")
def root():
    return {"success": True}

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    try:
        # Create file path
        file_path = UPLOAD_DIR / file.filename
        
        # Save the file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Detect image and get the result path
        result = model(file_path, save=True)
        result_path = Path(result[0].path) # Get the path of the saved image

        # Read the result image and convert to base64
        with open(result_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')

        # Clean up
        shutil.rmtree(PREDICT_DIR)
        file_path.unlink()
            
        return { 
            "success": True,
            "image": encoded_string
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")