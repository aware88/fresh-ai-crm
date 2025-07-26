import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsedItem = JSON.parse(item);
        if (key.includes('readEmails')) {
          // Ensure parsedItem is an array before creating Set
          const arrayData = Array.isArray(parsedItem) ? parsedItem : [];
          return new Set(arrayData) as T;
        }
        return parsedItem;
      }
      return initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        // Convert Set to Array for JSON serialization
        const serializedValue = valueToStore instanceof Set 
          ? Array.from(valueToStore) 
          : valueToStore;
        window.localStorage.setItem(key, JSON.stringify(serializedValue));
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    try {
        const item = window.localStorage.getItem(key);
        if (item) {
            const parsedItem = JSON.parse(item);
            if (key.includes('readEmails')) {
                // Ensure parsedItem is an array before creating Set
                const arrayData = Array.isArray(parsedItem) ? parsedItem : [];
                setStoredValue(new Set(arrayData) as T);
            } else {
                setStoredValue(parsedItem);
            }
        }
    } catch (error) {
        // If error, return initial value
        console.error(error);
    }
  }, [key]);

  return [storedValue, setValue];
} 