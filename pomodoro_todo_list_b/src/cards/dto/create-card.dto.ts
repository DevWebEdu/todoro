import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCardDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  title: string;

  @IsOptional()
  description?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  status?: string;
}
