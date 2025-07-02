export interface ThrottleEventOptions {
  durationMs?: number;
  keyGenerator?: (...args: any[]) => string;
  logger?: { debug?: (msg: string) => void };
}

export function ThrottleEvent(options: ThrottleEventOptions = {}): MethodDecorator {
  const lastEmitMap: Map<string, number> = new Map();
  const {
    durationMs = 1000,
    keyGenerator,
    logger,
  } = options;

  const defaultKeyGen = (...args: any[]): string => {
    const first = args[0];
    if (first && typeof first === 'object' && first.bizId && first.triggerContext && first.taskId) {
      return `${first.bizId}:${first.triggerContext}:${first.taskId}`;
    }
    try {
      return JSON.stringify(first);
    } catch {
      return String(first);
    }
  };

  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const keyBase = keyGenerator ? keyGenerator.apply(this, args) : defaultKeyGen(...args);
      const key = `${String(propertyKey)}:${keyBase}`;
      const now = Date.now();
      const last = lastEmitMap.get(key) ?? 0;

      if (now - last < durationMs) {
        logger?.debug?.(`ThrottleEvent: skip duplicate call of ${String(propertyKey)} for key ${key}`);
        return;
      }

      lastEmitMap.set(key, now);
      return original.apply(this, args);
    };
    return descriptor;
  };
}
