import type { Application } from 'egg';

export default (app: Application) => {
  const envKeys = process.env.APP_KEYS ? String(process.env.APP_KEYS).trim() : '';
  const configKeys = typeof app.config.keys === 'string' && app.config.keys ? app.config.keys.trim() : '';
  const fallbackKeys = `${app.name}_QsVn1B7y4z`;
  const resolvedKeys = envKeys || configKeys || fallbackKeys;
  const keyList = resolvedKeys
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);

  if (keyList.length === 0) {
    throw new Error('APP_KEYS must resolve to at least one non-empty value.');
  }

  app.config.keys = resolvedKeys;
  (app as unknown as { keys: string[] }).keys = keyList;
};
