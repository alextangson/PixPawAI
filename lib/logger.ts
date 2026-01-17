/**
 * Development Logger
 * Only logs in development environment to keep production clean
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const devLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

export const devWarn = (...args: any[]) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

export const devError = (...args: any[]) => {
  if (isDevelopment) {
    console.error(...args);
  }
};

// Always log errors in production too (for monitoring)
export const prodError = (...args: any[]) => {
  console.error(...args);
};

// Info logs that should appear in both dev and prod
export const info = (...args: any[]) => {
  console.log(...args);
};
