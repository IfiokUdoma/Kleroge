import {
  IsEnum, IsInt, IsNumber, IsOptional,
  IsPositive, IsString, Length, Max, MaxLength, Min,
} from 'class-validator';
import { PropertyCurrency, PropertyType } from '../entities/property-enums';

export class CreatePropertyDto {
  @IsString()
  @Length(5, 200)
  title: string;

  @IsString()
  @Length(20, 5000)
  description: string;

  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @IsString()
  @Length(2, 2)
  country: string;

  @IsString()
  @MaxLength(100)
  city: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @IsEnum(PropertyCurrency)
  currency: PropertyCurrency;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  areaSqm?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  bathrooms?: number;
}
