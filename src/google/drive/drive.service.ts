import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { google, drive_v3 } from 'googleapis';

@Injectable()
export class DriveService {
  private oauth2Client: OAuth2Client;
  private googleClientId: string;
  private googleClientSecret: string;
  private googleRefreshToken: string;
  private googleRedirectUrl: string;
  private drive: drive_v3.Drive;

  constructor(private readonly configService: ConfigService) {
    this.googleClientId = this.configService.get<string>('GC_CLIENT_ID');
    this.googleClientSecret =
      this.configService.get<string>('GC_CLIENT_SECRET');
    this.googleRefreshToken =
      this.configService.get<string>('GC_REFRESH_TOKEN');
    this.googleRedirectUrl = this.configService.get<string>('GC_REDIRECT_URL');

    this.oauth2Client = new google.auth.OAuth2(
      this.googleClientId,
      this.googleClientSecret,
      this.googleRedirectUrl,
    );
    this.oauth2Client.setCredentials({
      refresh_token: this.googleRefreshToken,
    });

    this.drive = google.drive({
      version: 'v3',
      auth: this.oauth2Client,
    });
  }

  async uploadFile(file: Express.Multer.File) {
    const driveFile = await this.drive.files.create({
      requestBody: {
        name: file.originalname,
        mimeType: file.mimetype,
      },
      media: {
        mimeType: file.mimetype,
        body: file.buffer,
      },
    });
    return driveFile;
  }
  async deleteFile(fileId: string) {
    await this.drive.files.delete({
      fileId,
    });

    return 'File deleted';
  }

  async generatePublicUrl(fileId: string) {
    await this.drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
    const result = await this.drive.files.get({
      fileId,
      fields: 'webViewLink, webContentLink',
    });
    return result.data;
  }
}
