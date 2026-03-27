import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Prediction } from './prediction.entity';
import { UserScore } from './user-score.entity';

@Entity('users')
@Index(['email'])
@Index(['googleId'])
export class User {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar', { length: 255, unique: true })
  googleId!: string;

  @Column('varchar', { length: 255, unique: true })
  email!: string;

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('boolean', { default: false })
  registrationCompleted!: boolean;

  @Column('boolean', { default: false })
  paymentCompleted!: boolean;

  @Column('timestamp', { nullable: true })
  registrationTimestamp!: Date | null;

  @Column('timestamp', { nullable: true })
  paymentTimestamp!: Date | null;

  @Column('varchar', { length: 50, default: 'user' })
  role!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Prediction, (prediction) => prediction.user, {
    cascade: true,
  })
  predictions!: Prediction[];

  @OneToMany(() => UserScore, (userScore) => userScore.user, {
    cascade: true,
  })
  scores!: UserScore[];
}
