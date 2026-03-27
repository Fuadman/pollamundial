import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Match } from './match.entity';
import { MatchResult } from './match-result.entity';

@Entity('teams')
@Index(['code'])
export class Team {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('varchar', { length: 3, unique: true })
  code!: string;

  @Column('varchar', { length: 1, nullable: true })
  groupStageGroup!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Match, (match) => match.team1)
  matchesAsTeam1!: Match[];

  @OneToMany(() => Match, (match) => match.team2)
  matchesAsTeam2!: Match[];

  @OneToMany(() => MatchResult, (result) => result.winner, {
    nullable: true,
  })
  wonMatches!: MatchResult[];
}
