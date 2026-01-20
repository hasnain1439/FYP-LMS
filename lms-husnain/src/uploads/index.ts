import multer from "multer";
import path from "path";
import fs from "fs";

// ✅ OK: Ensure upload directory exists in the ROOT folder
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ✅ OK: Correctly configured storage object
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // ✅ OK: Removes spaces to prevent URL errors
    const cleanName = file.originalname.replace(/\s+/g, '-');
    cb(null, uniqueSuffix + "-" + cleanName);
  },
});

export const upload = multer({ storage: storage });