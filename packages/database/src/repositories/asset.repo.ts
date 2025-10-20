import { eq, and, desc } from 'drizzle-orm';
import { DbClient } from '../client';
import { assets, labels, textChunks, type Asset, type NewAsset, type Label, type NewLabel, type TextChunk, type NewTextChunk } from '../schema/assets';

export class AssetRepository {
  constructor(private db: DbClient) {}

  // Asset operations
  async findById(id: string): Promise<Asset | undefined> {
    return await this.db.query.assets.findFirst({
      where: eq(assets.id, id),
    });
  }

  async findByUserId(userId: string, limit: number = 100, offset: number = 0): Promise<Asset[]> {
    return await this.db.query.assets.findMany({
      where: eq(assets.user_id, userId),
      limit,
      offset,
      orderBy: [desc(assets.created_at)],
    });
  }

  async findByFolderId(folderId: string, limit: number = 100, offset: number = 0): Promise<Asset[]> {
    return await this.db.query.assets.findMany({
      where: eq(assets.folder_id, folderId),
      limit,
      offset,
      orderBy: [desc(assets.created_at)],
    });
  }

  async findBySha256(sha256: string, userId: string): Promise<Asset | undefined> {
    return await this.db.query.assets.findFirst({
      where: and(
        eq(assets.sha256, sha256),
        eq(assets.user_id, userId)
      ),
    });
  }

  async create(data: NewAsset): Promise<Asset> {
    const result = await this.db.insert(assets).values(data).returning();
    return result[0];
  }

  async updateStatus(id: string, status: 'pending' | 'processing' | 'ready' | 'error'): Promise<Asset | undefined> {
    const result = await this.db
      .update(assets)
      .set({ status, updated_at: new Date().toISOString() })
      .where(eq(assets.id, id))
      .returning();
    return result[0];
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(assets).where(eq(assets.id, id));
  }

  // Label operations
  async addLabel(assetId: string, key: string, value: string): Promise<Label> {
    const result = await this.db.insert(labels).values({ asset_id: assetId, key, value }).returning();
    return result[0];
  }

  async getLabels(assetId: string): Promise<Label[]> {
    return await this.db.query.labels.findMany({
      where: eq(labels.asset_id, assetId),
    });
  }

  async deleteLabel(assetId: string, key: string): Promise<void> {
    await this.db.delete(labels).where(
      and(
        eq(labels.asset_id, assetId),
        eq(labels.key, key)
      )
    );
  }

  // Text chunk operations
  async addTextChunk(data: NewTextChunk): Promise<TextChunk> {
    const result = await this.db.insert(textChunks).values(data).returning();
    return result[0];
  }

  async getTextChunks(assetId: string): Promise<TextChunk[]> {
    return await this.db.query.textChunks.findMany({
      where: eq(textChunks.asset_id, assetId),
    });
  }

  async deleteTextChunks(assetId: string): Promise<void> {
    await this.db.delete(textChunks).where(eq(textChunks.asset_id, assetId));
  }
}

