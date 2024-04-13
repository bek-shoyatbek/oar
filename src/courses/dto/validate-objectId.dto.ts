import { IsMongoId, IsString } from 'class-validator';

export class ValidateObjectIdDto {
  @IsMongoId()
  @IsString()
  id: string;
}
