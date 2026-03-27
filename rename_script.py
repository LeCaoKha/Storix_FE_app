import os
import time

def force_rename(src, dst):
    for i in range(3):
        try:
            if os.path.exists(src):
                os.rename(src, dst)
                print(f"Renamed: {src} -> {dst}")
                return True
            else:
                print(f"Not found: {src}")
                return False
        except Exception as e:
            print(f"Attempt {i+1} failed for {src}: {e}")
            time.sleep(1)
    return False

# Rename folders to start with underscore so Expo Router ignores them
force_rename(r"d:\KY9\do an\Code\Storix_FE_app\app\(manager-tabs)\requisitions", r"d:\KY9\do an\Code\Storix_FE_app\app\(manager-tabs)\_requisitions")
force_rename(r"d:\KY9\do an\Code\Storix_FE_app\app\(manager-tabs)\orders", r"d:\KY9\do an\Code\Storix_FE_app\app\(manager-tabs)\_orders")
force_rename(r"d:\KY9\do an\Code\Storix_FE_app\app\(manager-tabs)\cleanup.js", r"d:\KY9\do an\Code\Storix_FE_app\app\(manager-tabs)\_cleanup.js")
