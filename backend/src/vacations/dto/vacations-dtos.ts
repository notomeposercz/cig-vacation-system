import { IsNotEmpty, IsUUID, IsDate, IsBoolean, IsOptional, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { VacationType, VacationStatus } from '../entities/vacation-request.entity';

export class CreateVacationRequestDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  endDate: Date;

  @IsBoolean()
  @IsOptional()
  halfDayStart?: boolean = false;

  @IsBoolean()
  @IsOptional()
  halfDayEnd?: boolean = false;

  @IsEnum(VacationType)
  @IsOptional()
  type?: VacationType = VacationType.VACATION;

  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateVacationRequestDto {
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @IsBoolean()
  @IsOptional()
  halfDayStart?: boolean;

  @IsBoolean()
  @IsOptional()
  halfDayEnd?: boolean;

  @IsEnum(VacationType)
  @IsOptional()
  type?: VacationType;

  @IsEnum(VacationStatus)
  @IsOptional()
  status?: VacationStatus;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateVacationSettingDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  year: number;

  @IsNotEmpty()
  totalDays: number;

  @IsOptional()
  carriedDays?: number = 0;
}

export class ApproveVacationRequestDto {
  @IsUUID()
  @IsNotEmpty()
  approverId: string;

  @IsString()
  @IsOptional()
  note?: string;
}
