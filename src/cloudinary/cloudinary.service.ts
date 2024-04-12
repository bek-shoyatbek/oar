import { Injectable } from '@nestjs/common';
import { v2 } from 'cloudinary';
import * as streamifier from 'streamifier';
import { CloudinaryResponse } from './interfaces/cloudinary-response';

@Injectable()
export class CloudinaryService {
  async upload(file: Express.Multer.File): Promise<CloudinaryResponse> {
    return new Promise((resolve, reject) => {
      const upload = v2.uploader.upload_stream((error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
      streamifier.createReadStream(file.buffer).pipe(upload);
    });
  }
}
