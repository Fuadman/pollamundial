import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Team } from './team.entity';
import { Prediction } from './prediction.entity';
import { MatchResult } from './match-result.entity';

export enum MatchStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  POSTPONED = 'postponed',
}

export enum MatchPhase {
  GROUP = 'group',
  ELIMINATION = 'elimination',
}

@Entity('matches')
@Index(['scheduledTime'])
@Index(['status'])
@Index(['phase'])
@Index(['team1Id', 'team2Id'])
export class Match {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  team1Id!: string;

  @ManyToOne(() => Team, (team) => team.matchesAsTeam1, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'team1_id' })
  team1!: Team;

  @Column('uuid')
  team2Id!: string;

  @ManyToOne(() => Team, (team) => team.matchesAsTeam2, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'team2_id' })
  team2!: Team;

  @Column('timestamp')
  scheduledTime!: Date;

  @Column('timestamp')
  lockdownTime!: Date;

  @Column('varchar', { length: 50, default: MatchStatus.SCHEDULED })
  status!: MatchStatus;

  @Column('varchar', { length: 50 })
  phase!: MatchPhase;

  @Column('varchar', { length: 1, nullable: true })
  groupStageGroup!: string | null;

  @Column('varchar', { length: 50, nullable: true })
  eliminationRound!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Prediction, (prediction) => prediction.match, {
    cascade: true,
  })
  predictions!: Prediction[];

  @OneToOne(() => MatchResult, (result) => result.match, {
    nullable: true,
    cascade: true,
  })
  result!: MatchResult | null;
}
