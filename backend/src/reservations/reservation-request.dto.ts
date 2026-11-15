import { IsEmail, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength } from "class-validator";

export class ReservationRequestDto {
  @IsUUID()
  idempotencyKey!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  guestName!: string;

  @IsString()
  @Matches(/^\+?[0-9()\-\s]{9,24}$/, { message: "A valid phone number is required" })
  guestPhone!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  guestEmail?: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  visitDate!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  visitTime!: string;

  @IsInt()
  @Min(1)
  @Max(12)
  partySize!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  // Invisible bot trap. Never publish this as meaningful customer data.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
