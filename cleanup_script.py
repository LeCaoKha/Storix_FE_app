import os
import stat

files_to_delete = [
    r"d:\KY9\do an\Code\Storix_FE_app\app\(manager-tabs)\requisitions.tsx",
    r"d:\KY9\do an\Code\Storix_FE_app\app\(manager-tabs)\orders.tsx",
    r"d:\KY9\do an\Code\Storix_FE_app\app\(manager-tabs)\cleanup.js",
    r"d:\KY9\do an\Code\Storix_FE_app\app\(manager-tabs)\requisitions\index.tsx",
    r"d:\KY9\do an\Code\Storix_FE_app\app\(manager-tabs)\orders\index.tsx"
]

for file_path in files_to_delete:
    try:
        if os.path.exists(file_path):
            # Try to remove read-only attribute
            os.chmod(file_path, stat.S_IWRITE)
            os.remove(file_path)
            print(f"Deleted: {file_path}")
        else:
            print(f"Not found: {file_path}")
    except Exception as e:
        print(f"Error deleting {file_path}: {e}")
