from PIL import Image
import os

def remove_magenta(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    for item in datas:
        # Check if the pixel is magenta-ish (AI generation might have tiny variations)
        # Magenta is (255, 0, 255)
        r, g, b, a = item
        if r > 200 and g < 50 and b > 200:
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Successfully saved true transparent logo to {output_path}")

if __name__ == "__main__":
    input_img = r"C:\Users\USER1\Desktop\projects\embakasi\referral-pwa\src\assets\logo_magenta.png"
    output_img = r"C:\Users\USER1\Desktop\projects\embakasi\referral-pwa\src\assets\logo.png"
    remove_magenta(input_img, output_img)
