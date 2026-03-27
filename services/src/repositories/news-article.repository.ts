import { Injectable } from '@nestjs/common';
import { DataSource, Repository, Between } from 'typeorm';
import { NewsArticle } from '../entities/news-article.entity';

@Injectable()
export class NewsArticleRepository extends Repository<NewsArticle> {
  constructor(private dataSource: DataSource) {
    super(NewsArticle, dataSource.createEntityManager());
  }

  async findPublishedArticles(): Promise<NewsArticle[]> {
    return this.find({
      where: { archived: false },
      order: { publishedTimestamp: 'DESC' },
    });
  }

  async findArchivedArticles(): Promise<NewsArticle[]> {
    return this.find({
      where: { archived: true },
      order: { publishedTimestamp: 'DESC' },
    });
  }

  async findRecentArticles(limit: number = 10): Promise<NewsArticle[]> {
    return this.find({
      where: { archived: false },
      order: { publishedTimestamp: 'DESC' },
      take: limit,
    });
  }

  async findArticlesByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<NewsArticle[]> {
    return this.find({
      where: {
        publishedTimestamp: Between(startDate, endDate),
        archived: false,
      },
      order: { publishedTimestamp: 'DESC' },
    });
  }

  async findByTitle(title: string): Promise<NewsArticle | null> {
    return this.findOne({
      where: { title, archived: false },
    });
  }

  async archiveArticle(articleId: string): Promise<void> {
    await this.update(articleId, { archived: true });
  }

  async unarchiveArticle(articleId: string): Promise<void> {
    await this.update(articleId, { archived: false });
  }

  async updateArticle(
    articleId: string,
    title: string,
    content: string,
  ): Promise<void> {
    await this.update(articleId, {
      title,
      content,
      modifiedTimestamp: new Date(),
    });
  }

  async countPublished(): Promise<number> {
    return this.count({ where: { archived: false } });
  }

  async countArchived(): Promise<number> {
    return this.count({ where: { archived: true } });
  }
}
