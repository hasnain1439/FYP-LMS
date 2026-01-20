import cv2
import numpy as np
from typing import Optional

def resize_image(image: np.ndarray, max_size: int) -> np.ndarray:
    """
    Resize image if it's larger than max_size while maintaining aspect ratio
    """
    h, w = image.shape[:2]
    
    if max(h, w) <= max_size:
        return image
    
    # Calculate new dimensions
    if h > w:
        new_h = max_size
        new_w = int(w * (max_size / h))
    else:
        new_w = max_size
        new_h = int(h * (max_size / w))
    
    # Resize image
    resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
    
    return resized

def convert_to_rgb(image: np.ndarray) -> np.ndarray:
    """
    Convert BGR image to RGB
    """
    if len(image.shape) == 3 and image.shape[2] == 3:
        return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    return image

def validate_image(image: np.ndarray) -> bool:
    """
    Validate if image is proper numpy array
    """
    if image is None:
        return False
    
    if not isinstance(image, np.ndarray):
        return False
    
    if image.size == 0:
        return False
    
    if len(image.shape) not in [2, 3]:
        return False
    
    return True

def preprocess_image_for_detection(image: np.ndarray) -> Optional[np.ndarray]:
    """
    Preprocess image for face detection
    """
    try:
        if not validate_image(image):
            return None
        
        # Convert to RGB if needed
        if len(image.shape) == 3 and image.shape[2] == 3:
            rgb_image = convert_to_rgb(image)
        else:
            rgb_image = image
        
        return rgb_image
        
    except Exception:
        return None