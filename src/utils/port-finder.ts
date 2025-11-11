/**
 * Utility for finding available ports
 */

import * as net from 'net';

/**
 * Result of port finding operation
 */
export interface PortFinderResult {
  /** The available port that was found */
  port: number;
  /** Whether the originally requested port was available */
  wasRequested: boolean;
}

/**
 * PortFinder provides utilities for finding available ports
 */
export class PortFinder {
  /**
   * Check if a specific port is available
   */
  static async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          resolve(false);
        }
      });
      
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      
      server.listen(port);
    });
  }

  /**
   * Find an available port starting from the given port
   * 
   * @param startPort - Port to start searching from
   * @param maxAttempts - Maximum number of ports to try (default: 10)
   * @returns The first available port found
   * @throws Error if no available port is found within maxAttempts
   */
  static async findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
    for (let i = 0; i < maxAttempts; i++) {
      const port = startPort + i;
      const available = await this.isPortAvailable(port);
      
      if (available) {
        return port;
      }
    }
    
    throw new Error(
      `Could not find an available port. Tried ports ${startPort} to ${startPort + maxAttempts - 1}.`
    );
  }

  /**
   * Find a port with fallback behavior
   * 
   * If userSuppliedPort is true and the port is not available, throws an error.
   * If userSuppliedPort is false and the port is not available, tries to find the next available port.
   * 
   * @param port - The desired port number
   * @param userSuppliedPort - Whether the port was explicitly supplied by the user
   * @returns PortFinderResult with the available port and whether it was the requested one
   * @throws Error if userSuppliedPort is true and the port is not available
   */
  static async findPortWithFallback(
    port: number,
    userSuppliedPort: boolean
  ): Promise<PortFinderResult> {
    const available = await this.isPortAvailable(port);
    
    if (available) {
      return {
        port,
        wasRequested: true
      };
    }
    
    // Port is not available
    if (userSuppliedPort) {
      throw new Error(
        `Port ${port} is already in use. Please choose a different port using --port flag.`
      );
    }
    
    // Try to find next available port
    const nextPort = await this.findAvailablePort(port + 1);
    
    return {
      port: nextPort,
      wasRequested: false
    };
  }
}
