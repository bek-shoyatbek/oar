import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  async upload(file: Express.Multer.File) {
    const fileName = this.getUniqueFilename(file.originalname);

    const domainName = this.configService.get<string>(
      'AWS_CLOUDFRONT_DOMAIN_NAME',
    );
    const bucketName = this.configService.get<string>('AWS_BUCKET_NAME');
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
    await this.s3Client.send(new PutObjectCommand(params));

    const fileUrl = `${domainName}/${fileName}`;

    return fileUrl;
  }

  async generateSignedUrl(fileURL: string) {
    const fileKey = fileURL.split('/').pop();

    const command = new GetObjectCommand({
      Bucket: this.configService.get<string>('AWS_BUCKET_NAME'),
      Key: fileKey,
    });

    const oneDay = 60 * 60 * 1; // 1 hours
    return getSignedUrl(this.s3Client, command, { expiresIn: oneDay });
  }
  private getUniqueFilename(originalName: string) {
    const ext = originalName.split('.')[originalName.split('.').length - 1];

    const randomString = Date.now().valueOf();

    return `${randomString}.${ext}`;
  }
}
