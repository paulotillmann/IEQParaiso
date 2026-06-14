from PIL import Image

def trim_image(path):
    try:
        img = Image.open(path)
        # Convert to RGBA just in case
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Get bounding box of non-transparent pixels
        bbox = img.getbbox()
        if bbox:
            # Crop to the bounding box
            trimmed = img.crop(bbox)
            trimmed.save(path)
            print(f"Successfully trimmed {path} to bbox {bbox}")
        else:
            print(f"Could not trim {path}: no active pixels found.")
    except Exception as e:
        print(f"Error trimming {path}: {str(e)}")

trim_image("logos/logo_branca.png")
trim_image("logos/logo_preta.png")
