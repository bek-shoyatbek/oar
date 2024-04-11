import { diskStorage } from 'multer';

export const STORAGE = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const extension = file.mimetype.split('/')[1];
    cb(null, `${Date.now()}.${extension}`);
  },
});
