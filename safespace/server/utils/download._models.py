import os
import gdown

def download_model_if_missing(filename, drive_id, dest_folder="models"):
    os.makedirs(dest_folder, exist_ok=True)
    filepath = os.path.join(dest_folder, filename)

    if not os.path.exists(filepath):
        print(f"📥 Downloading {filename} from Google Drive...")
        url = f"https://drive.google.com/uc?id={drive_id}"
        gdown.download(url, output=filepath, quiet=False)
    else:
        print(f"✅ Model already exists at {filepath}")

    return filepath
