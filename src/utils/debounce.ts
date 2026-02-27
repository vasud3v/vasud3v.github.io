/**
 * Debounce utility for batching rapid function calls
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Batch multiple calls and execute once with all accumulated data
 */
export class BatchProcessor<T> {
  private batch: Set<T> = new Set();
  private timeout: NodeJS.Timeout | null = null;
  private readonly processor: (items: T[]) => void;
  private readonly delay: number;

  constructor(processor: (items: T[]) => void, delay: number = 100) {
    this.processor = processor;
    this.delay = delay;
  }

  add(item: T): void {
    this.batch.add(item);

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  flush(): void {
    if (this.batch.size > 0) {
      const items = Array.from(this.batch);
      this.batch.clear();
      this.processor(items);
    }
    this.timeout = null;
  }
}
