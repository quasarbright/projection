/**
 * Logger utility for consistent, colored console output
 */

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Foreground colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  
  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

/**
 * Check if colors should be disabled (for CI environments or when piped)
 */
const shouldUseColors = (): boolean => {
  return process.stdout.isTTY && process.env.NO_COLOR !== '1';
};

/**
 * Apply color to text if colors are enabled
 */
const colorize = (text: string, color: string): string => {
  if (!shouldUseColors()) {
    return text;
  }
  return `${color}${text}${colors.reset}`;
};

/**
 * Logger class with colored output methods
 */
export class Logger {
  /**
   * Log a success message (green checkmark)
   */
  static success(message: string): void {
    console.log(colorize('✓', colors.green) + ' ' + message);
  }

  /**
   * Log an error message (red X)
   */
  static error(message: string): void {
    console.error(colorize('✗', colors.red) + ' ' + colorize(message, colors.red));
  }

  /**
   * Log a warning message (yellow warning sign)
   */
  static warn(message: string): void {
    console.warn(colorize('⚠', colors.yellow) + ' ' + colorize(message, colors.yellow));
  }

  /**
   * Log an info message (blue info icon)
   */
  static info(message: string): void {
    console.log(colorize('ℹ', colors.blue) + ' ' + message);
  }

  /**
   * Log a step/progress message (cyan arrow)
   */
  static step(message: string): void {
    console.log(colorize('→', colors.cyan) + ' ' + message);
  }

  /**
   * Log a header message (bright/bold)
   */
  static header(message: string): void {
    console.log('\n' + colorize(message, colors.bright));
  }

  /**
   * Log a plain message
   */
  static log(message: string): void {
    console.log(message);
  }

  /**
   * Log a dimmed/secondary message
   */
  static dim(message: string): void {
    console.log(colorize(message, colors.dim));
  }

  /**
   * Log with a custom emoji/icon
   */
  static icon(icon: string, message: string, color?: string): void {
    const iconText = color ? colorize(icon, color) : icon;
    console.log(iconText + ' ' + message);
  }

  /**
   * Create a blank line
   */
  static newline(): void {
    console.log('');
  }

  /**
   * Log a list of items with bullets
   */
  static list(items: string[], indent: number = 2): void {
    const spaces = ' '.repeat(indent);
    items.forEach(item => {
      console.log(`${spaces}• ${item}`);
    });
  }

  /**
   * Log a numbered list
   */
  static numberedList(items: string[], indent: number = 2): void {
    const spaces = ' '.repeat(indent);
    items.forEach((item, index) => {
      console.log(`${spaces}${index + 1}. ${item}`);
    });
  }

  /**
   * Log a key-value pair
   */
  static keyValue(key: string, value: string, indent: number = 2): void {
    const spaces = ' '.repeat(indent);
    console.log(`${spaces}${colorize(key + ':', colors.cyan)} ${value}`);
  }

  /**
   * Log a separator line
   */
  static separator(char: string = '─', length: number = 50): void {
    console.log(colorize(char.repeat(length), colors.dim));
  }

  /**
   * Log a box with a message
   */
  static box(message: string): void {
    const lines = message.split('\n');
    const maxLength = Math.max(...lines.map(l => l.length));
    const border = '─'.repeat(maxLength + 2);
    
    console.log(colorize('┌' + border + '┐', colors.dim));
    lines.forEach(line => {
      const padding = ' '.repeat(maxLength - line.length);
      console.log(colorize('│', colors.dim) + ' ' + line + padding + ' ' + colorize('│', colors.dim));
    });
    console.log(colorize('└' + border + '┘', colors.dim));
  }
}

/**
 * Convenience exports for common logging patterns
 */
export const log = Logger.log.bind(Logger);
export const success = Logger.success.bind(Logger);
export const error = Logger.error.bind(Logger);
export const warn = Logger.warn.bind(Logger);
export const info = Logger.info.bind(Logger);
export const step = Logger.step.bind(Logger);
