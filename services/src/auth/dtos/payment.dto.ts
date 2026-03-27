import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class PaymentDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  paymentMethodId!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  currency!: string;
}
