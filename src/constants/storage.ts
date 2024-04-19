import { diskStorage, memoryStorage } from 'multer';

export const STORAGE = memoryStorage();
// export const STORAGE = diskStorage({
//   destination: './uploads',
//   filename: function (req, file, cb) {
//     cb(null, file.originalname);
//   },
// });
