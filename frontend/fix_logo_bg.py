from PIL import Image

def remove_white_background(input_path, output_path, threshold=240):
    """Remove white/near-white background from image, making it transparent."""
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    new_data = []
    for item in datas:
        r, g, b, a = item
        # If all channels are near-white, make it transparent
        if r >= threshold and g >= threshold and b >= threshold:
            new_data.append((r, g, b, 0))  # fully transparent
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Done! Saved transparent logo to: {output_path}")

if __name__ == "__main__":
    input_img  = r"C:\Users\USER1\Desktop\projects\refferal\src\assets\logo.png"
    output_img = r"C:\Users\USER1\Desktop\projects\refferal\src\assets\logo.png"
    remove_white_background(input_img, output_img, threshold=240)
