import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Match } from './match.entity';

@Entity('predictions')
@Unique(['userId', 'matchId'])
@Index(['userId'])
@Index(['matchId'])
@Index(['lockedTimestamp'])
export class Prediction {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @ManyToOne(() => User, (user) => user.predictions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column('uuid')
  matchId!: string;

  @ManyToOne(() => Match, (match) => match.predictions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'match_id' })
  match!: Match;

  @Column('int', { nullable: true })
  predictedTeam1Score!: number | null;

  @Column('int', { nullable: true })
  predictedTeam2Score!: number | null;

  @Column('uuid', { nullable: true })
  predictedWinnerId!: string | null;

  @Column('boolean', { default: false })
  predictedDraw!: boolean;

  @Column('timestamp')
  submissionTimestamp!: Date;

  @Column('timestamp', { nullable: true })
  lockedTimestamp!: Date | null;

  @Column('int', { default: 0 })
  pointsEarned!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
