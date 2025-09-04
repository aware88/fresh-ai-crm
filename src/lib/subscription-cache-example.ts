// Example with Redis caching
class SubscriptionCache {
  private redis = new Redis(process.env.REDIS_URL);
  
  async getSubscription(userId: string) {
    // Try cache first
    const cached = await this.redis.get(`subscription:${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Fetch from database
    const subscription = await this.fetchFromDatabase(userId);
    
    // Cache for 1 hour
    await this.redis.setex(
      `subscription:${userId}`, 
      3600, 
      JSON.stringify(subscription)
    );
    
    return subscription;
  }
  
  async invalidate(userId: string) {
    await this.redis.del(`subscription:${userId}`);
  }
}