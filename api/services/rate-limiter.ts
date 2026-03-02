type RateLimiterOptions = {
  windowMs: number;
  max: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

export const rateLimiter = (options: RateLimiterOptions) => {
  const buckets = new Map<string, Bucket>();

  const allow = (key: string) => {
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return true;
    }

    if (bucket.count >= options.max) {
      return false;
    }

    bucket.count += 1;
    return true;
  };

  return { allow };
};
