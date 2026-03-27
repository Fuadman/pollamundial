import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Prediction } from './prediction.entity';
import { MatchResult } from './match-result.entity';

@Entity('simulation_data')
@Index(['userId'])
@Index(['predictionId'])
@Index(['matchResultId'])
@Index(['isTestData'])
export class SimulationData {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @Column('uuid', { nullable: true })
  predictionId!: string | null;

  @ManyToOne(() => Prediction, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'prediction_id' })
  prediction!: Prediction | null;

  @Column('uuid', { nullable: true })
  matchResultId!: string | null;

  @ManyToOne(() => MatchResult, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'match_result_id' })
  matchResult!: MatchResult | null;

  @Column('boolean', { default: true })
  isTestData!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
