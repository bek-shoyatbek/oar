import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
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

    console.log('fileName', fileName);

    const domainName = this.configService.get<string>('AWS_CF_DOMAIN');
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
    const domainName = this.configService.get<string>('AWS_CF_DOMAIN_PRIVATE');
    const privateKey = this.configService.get<string>('AWS_CF_PRIVATE_KEY');
    const keypairId = this.configService.get<string>('AWS_CF_KEYPAIR_ID');

    const fileKey = fileURL.split('/').pop();

    const expires = new Date(Date.now() + 1000 * 60 * 60 * 1); // EXPIRES IN 1 HOUR

    const signedUrl = getSignedUrl({
      url: `${domainName}/${fileKey}`,
      dateLessThan: expires.toISOString(),
      privateKey,
      keyPairId: keypairId,
    });

    return signedUrl;
  }
  private getUniqueFilename(originalName: string) {
    const ext = originalName.split('.')[originalName.split('.').length - 1];

    const randomString = Date.now().valueOf();

    return `${randomString}.${ext}`;
  }
}
