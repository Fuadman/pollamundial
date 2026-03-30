import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Match } from './match.entity';
import { Team } from './team.entity';

@Entity('match_results')
@Index(['matchId'])
export class MatchResult {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { unique: true })
  matchId!: string;

  @OneToOne(() => Match, (match) => match.result, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'match_id' })
  match!: Match;

  @Column('int')
  team1Score!: number;

  @Column('int')
  team2Score!: number;

  @Column('int', { nullable: true })
  team1PenaltyScore!: number | null;

  @Column('int', { nullable: true })
  team2PenaltyScore!: number | null;

  @Column('boolean', { default: false })
  decidedByPenalties!: boolean;

  @Column('uuid', { nullable: true })
  winnerId!: string | null;

  @ManyToOne(() => Team, (team) => team.wonMatches, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'winner_id' })
  winner!: Team | null;

  @Column('boolean', { default: false })
  isDraw!: boolean;

  @Column('timestamp')
  publishedTimestamp!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
