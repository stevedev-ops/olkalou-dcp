from PIL import Image
import os

def crop_vertical_transparency(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    
    # Get bounding box of non-transparent areas
    bbox = img.getbbox()
    if bbox:
        # Crop to bounding box
        left, top, right, bottom = bbox
        
        # We only want to crop top and bottom, but let's just do a tight crop for now
        # Actually the user said "top and bottom", so let's keep the width but crop the height
        # left = 0, right = img.width
        cropped = img.crop((0, top, img.width, bottom))
        cropped.save(output_path, "PNG")
        print(f"Successfully cropped vertical space and saved to {output_path}")
    else:
        print("Image is entirely transparent!")

if __name__ == "__main__":
    input_img = r"C:\Users\USER1\Desktop\projects\embakasi\referral-pwa\src\assets\logo.png"
    output_img = r"C:\Users\USER1\Desktop\projects\embakasi\referral-pwa\src\assets\logo.png"
    crop_vertical_transparency(input_img, output_img)
