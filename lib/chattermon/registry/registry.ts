// Generic id-keyed registry. Used as a singleton per content kind
// (species, moves, traits, natures, mutations, items, biomes).
//
// Pattern: Registry / Service Locator. Static registration at module load
// time keeps content additive — drop a new file, call register() in its
// `index.ts`, and the rest of the system can resolve it by id.

export class Registry<T extends { id: string }> {
  private readonly items = new Map<string, T>();

  constructor(private readonly kind: string) {}

  register(item: T): void {
    if (this.items.has(item.id)) {
      throw new Error(`${this.kind}: duplicate id "${item.id}"`);
    }
    this.items.set(item.id, item);
  }

  get(id: string): T {
    const item = this.items.get(id);
    if (!item) throw new Error(`${this.kind}: unknown id "${id}"`);
    return item;
  }

  tryGet(id: string): T | undefined {
    return this.items.get(id);
  }

  has(id: string): boolean {
    return this.items.has(id);
  }

  all(): readonly T[] {
    return Array.from(this.items.values());
  }

  ids(): readonly string[] {
    return Array.from(this.items.keys());
  }

  size(): number {
    return this.items.size;
  }
}
