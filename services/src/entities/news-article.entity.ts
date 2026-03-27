import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('news_articles')
@Index(['publishedTimestamp'])
@Index(['archived'])
export class NewsArticle {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar', { length: 255 })
  title!: string;

  @Column('text')
  content!: string;

  @Column('timestamp')
  publishedTimestamp!: Date;

  @Column('timestamp', { nullable: true })
  modifiedTimestamp!: Date | null;

  @Column('boolean', { default: false })
  archived!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
