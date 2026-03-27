import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_scores')
@Unique(['userId'])
@Index(['totalPoints'])
export class UserScore {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { unique: true })
  userId!: string;

  @ManyToOne(() => User, (user) => user.scores, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column('int', { default: 0 })
  totalPoints!: number;

  @Column('int', { default: 0 })
  groupStagePoints!: number;

  @Column('int', { default: 0 })
  eliminationPoints!: number;

  @UpdateDateColumn()
  updatedAt!: Date;
}
