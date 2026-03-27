import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { NewsArticleRepository } from '../repositories/news-article.repository';
import { NewsArticle } from '../entities/news-article.entity';
import { v4 as uuid } from 'uuid';

@Injectable()
export class NewsArticleService {
  constructor(private newsArticleRepository: NewsArticleRepository) {}

  async createArticle(
    title: string,
    content: string,
    publishedTimestamp?: Date,
  ): Promise<NewsArticle> {
    const article = this.newsArticleRepository.create({
      id: uuid(),
      title,
      content,
      publishedTimestamp: publishedTimestamp || new Date(),
      archived: false,
    });

    return this.newsArticleRepository.save(article);
  }

  async getArticleById(articleId: string): Promise<NewsArticle> {
    const article = await this.newsArticleRepository.findOne({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException(`Article with ID ${articleId} not found`);
    }

    return article;
  }

  async getPublishedArticles(): Promise<NewsArticle[]> {
    return this.newsArticleRepository.findPublishedArticles();
  }

  async getArchivedArticles(): Promise<NewsArticle[]> {
    return this.newsArticleRepository.findArchivedArticles();
  }

  async getRecentArticles(limit: number = 10): Promise<NewsArticle[]> {
    return this.newsArticleRepository.findRecentArticles(limit);
  }

  async getArticlesByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<NewsArticle[]> {
    return this.newsArticleRepository.findArticlesByDateRange(startDate, endDate);
  }

  async updateArticle(
    articleId: string,
    title: string,
    content: string,
  ): Promise<NewsArticle> {
    const article = await this.getArticleById(articleId);

    article.title = title;
    article.content = content;
    article.modifiedTimestamp = new Date();

    return this.newsArticleRepository.save(article);
  }

  async archiveArticle(articleId: string): Promise<NewsArticle> {
    const article = await this.getArticleById(articleId);

    if (article.archived) {
      throw new BadRequestException('Article is already archived');
    }

    await this.newsArticleRepository.archiveArticle(articleId);
    return this.getArticleById(articleId);
  }

  async unarchiveArticle(articleId: string): Promise<NewsArticle> {
    const article = await this.getArticleById(articleId);

    if (!article.archived) {
      throw new BadRequestException('Article is not archived');
    }

    await this.newsArticleRepository.unarchiveArticle(articleId);
    return this.getArticleById(articleId);
  }

  async deleteArticle(articleId: string): Promise<void> {
    const article = await this.getArticleById(articleId);
    await this.newsArticleRepository.remove(article);
  }

  async countPublishedArticles(): Promise<number> {
    return this.newsArticleRepository.countPublished();
  }

  async countArchivedArticles(): Promise<number> {
    return this.newsArticleRepository.countArchived();
  }
}
