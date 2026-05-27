import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateCardDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsObject()
  description?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  status?: string;
}
