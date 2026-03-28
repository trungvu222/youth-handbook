#!/usr/bin/env python3
"""
Script to remove white background from icon image
"""
from PIL import Image
import os

def remove_white_background(input_path, output_path, threshold=240):
    """
    Remove white background from an image
    
    Args:
        input_path: Path to input image
        output_path: Path to save output image
        threshold: RGB value threshold to consider as white (default 240)
    """
    # Open the image
    img = Image.open(input_path)
    
    # Convert to RGBA if not already
    img = img.convert("RGBA")
    
    # Get pixel data
    datas = img.getdata()
    
    # Create new data with transparent background
    new_data = []
    for item in datas:
        # If pixel is close to white (all RGB values above threshold)
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            # Make it transparent
            new_data.append((255, 255, 255, 0))
        else:
            # Keep the original pixel
            new_data.append(item)
    
    # Update image data
    img.putdata(new_data)
    
    # Save as PNG (supports transparency)
    img.save(output_path, "PNG")
    print(f"✅ Saved transparent icon to: {output_path}")
    
    # Also create optimized versions for different sizes
    sizes = [180, 192, 512]
    for size in sizes:
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        size_output = output_path.replace('.png', f'-{size}.png')
        resized.save(size_output, "PNG")
        print(f"✅ Created {size}x{size} version: {size_output}")

if __name__ == "__main__":
    # List of files to process
    files_to_process = [
        {
            "input": "/Users/vuthanhtrung/Downloads/youth-handbook/public/Icon-App-Chua-tach-nen.jpg",
            "output": "/Users/vuthanhtrung/Downloads/youth-handbook/public/Icon-App.png"
        },
        {
            "input": "/Users/vuthanhtrung/Downloads/youth-handbook/public/Logo-App-Login.jpg",
            "output": "/Users/vuthanhtrung/Downloads/youth-handbook/public/Logo-App-Login.png"
        },
        {
            "input": "/Users/vuthanhtrung/Downloads/youth-handbook/public/Logo-Web.jpg",
            "output": "/Users/vuthanhtrung/Downloads/youth-handbook/public/Logo-Web.png"
        }
    ]
    
    print("🚀 Starting batch white background removal...\n")
    
    for file_info in files_to_process:
        input_file = file_info["input"]
        output_file = file_info["output"]
        
        if os.path.exists(input_file):
            print(f"🔄 Processing: {os.path.basename(input_file)}")
            remove_white_background(input_file, output_file)
            print()
        else:
            print(f"❌ Error: File not found: {input_file}\n")
    
    print("✨ All done! White backgrounds removed for all logos.")
