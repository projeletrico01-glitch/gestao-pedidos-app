import { ExcludedComponentItem } from '../types';

const STORAGE_KEY = 'termoprol_blocked_components_memory';

/**
 * Retrieves the global persistent memory of blocked components.
 * This memory persists across orders, environments, and even if the original list is deleted.
 */
export function getBlockedMemory(): ExcludedComponentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading blocked components memory:', err);
    return [];
  }
}

/**
 * Saves items into the global persistent memory of blocked components.
 */
export function saveBlockedMemory(items: ExcludedComponentItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Error saving blocked components memory:', err);
  }
}

/**
 * Adds an item to the blocked memory if not already present.
 */
export function addToBlockedMemory(item: { code?: string; name?: string; from?: string }): ExcludedComponentItem[] {
  const normCode = (item.code || '').trim().toUpperCase();
  const normName = (item.name || '').trim();
  if (!normCode && !normName) return getBlockedMemory();

  const current = getBlockedMemory();
  const exists = current.some(ex => {
    const exCode = (ex.code || '').trim().toUpperCase();
    const exName = (ex.name || '').trim().toLowerCase();
    if (normCode && exCode && normCode === exCode) return true;
    if (normName && exName && normName.toLowerCase() === exName) return true;
    return false;
  });

  if (!exists) {
    const updated = [
      ...current,
      {
        code: normCode,
        name: normName,
        from: item.from || 'Lista Removida / Excluída',
        excludedAt: new Date().toISOString()
      }
    ];
    saveBlockedMemory(updated);
    return updated;
  }

  return current;
}

/**
 * Removes an item from the blocked memory.
 */
export function removeFromBlockedMemory(code?: string, name?: string): ExcludedComponentItem[] {
  const normCode = (code || '').trim().toUpperCase();
  const normName = (name || '').trim().toLowerCase();
  const current = getBlockedMemory();

  const updated = current.filter(ex => {
    const exCode = (ex.code || '').trim().toUpperCase();
    const exName = (ex.name || '').trim().toLowerCase();
    if (normCode && exCode && normCode === exCode) return false;
    if (normName && exName && normName === exName) return false;
    return true;
  });

  saveBlockedMemory(updated);
  return updated;
}

/**
 * Clears the entire blocked memory.
 */
export function clearBlockedMemory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing blocked components memory:', err);
  }
}

/**
 * Checks if a component is blocked in either the global persistent memory or the order-level list.
 */
export function checkIsBlocked(
  code?: string,
  name?: string,
  orderExcluded?: ExcludedComponentItem[]
): { isBlocked: boolean; blockedItem?: ExcludedComponentItem } {
  const normCode = (code || '').trim().toUpperCase();
  const normName = (name || '').trim().toLowerCase();
  if (!normCode && !normName) return { isBlocked: false };

  // Combine global memory with order-specific exclusions
  const globalMemory = getBlockedMemory();
  const allExcluded = [...globalMemory, ...(orderExcluded || [])];

  for (const ex of allExcluded) {
    const exCode = (ex.code || '').trim().toUpperCase();
    const exName = (ex.name || '').trim().toLowerCase();
    if (normCode && exCode && normCode === exCode) {
      return { isBlocked: true, blockedItem: ex };
    }
    if (normName && exName && normName === exName) {
      return { isBlocked: true, blockedItem: ex };
    }
  }

  return { isBlocked: false };
}
