import type { Application } from 'egg';

const DEFAULT_KEY_SUFFIX = '_QsVn1B7y4z';

export default class AppBootHook {
  private readonly app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  #resolveKeys(): string {
    const envKeys = process.env.APP_KEYS ? String(process.env.APP_KEYS).trim() : '';
    const configKeys =
      typeof this.app.config.keys === 'string' && this.app.config.keys ? this.app.config.keys.trim() : '';
    const fallbackKeys = `${this.app.name}${DEFAULT_KEY_SUFFIX}`;
    const resolved = envKeys || configKeys || fallbackKeys;
    const keyList = resolved
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean);

    if (keyList.length === 0) {
      throw new Error('APP_KEYS must resolve to at least one non-empty value.');
    }

    return keyList.join(',');
  }

  configWillLoad() {
    const resolved = this.#resolveKeys();
    this.app.config.keys = resolved;
    // Reset cached keys so Egg recomputes with the sanitized value on first access.
    (this.app as unknown as { _keys?: string[] })._keys = undefined;
  }
}
