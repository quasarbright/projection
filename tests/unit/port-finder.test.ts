/**
 * Unit tests for PortFinder utility
 */

import * as net from 'net';
import { PortFinder } from '../../src/utils/port-finder';

describe('PortFinder', () => {
  let servers: net.Server[] = [];

  /**
   * Helper to occupy a port
   */
  async function occupyPort(port: number): Promise<net.Server> {
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      
      server.once('error', reject);
      server.once('listening', () => {
        servers.push(server);
        resolve(server);
      });
      
      server.listen(port);
    });
  }

  /**
   * Helper to close a server
   */
  async function closeServer(server: net.Server): Promise<void> {
    return new Promise((resolve) => {
      server.close(() => resolve());
    });
  }

  afterEach(async () => {
    // Close all servers
    for (const server of servers) {
      await closeServer(server);
    }
    servers = [];
  });

  describe('isPortAvailable', () => {
    it('should return true for an available port', async () => {
      const available = await PortFinder.isPortAvailable(9999);
      expect(available).toBe(true);
    });

    it('should return false for a port in use', async () => {
      await occupyPort(9998);
      const available = await PortFinder.isPortAvailable(9998);
      expect(available).toBe(false);
    });
  });

  describe('findAvailablePort', () => {
    it('should return the start port if available', async () => {
      const port = await PortFinder.findAvailablePort(9997);
      expect(port).toBe(9997);
    });

    it('should return the next available port if start port is occupied', async () => {
      await occupyPort(9996);
      const port = await PortFinder.findAvailablePort(9996);
      expect(port).toBe(9997);
    });

    it('should skip multiple occupied ports', async () => {
      await occupyPort(9995);
      await occupyPort(9996);
      await occupyPort(9997);
      const port = await PortFinder.findAvailablePort(9995);
      expect(port).toBe(9998);
    });

    it('should throw error if no port available within maxAttempts', async () => {
      // Occupy ports 9990-9994 (5 ports)
      for (let i = 0; i < 5; i++) {
        await occupyPort(9990 + i);
      }

      await expect(
        PortFinder.findAvailablePort(9990, 5)
      ).rejects.toThrow('Could not find an available port');
    });

    it('should respect maxAttempts parameter', async () => {
      await occupyPort(9989);
      await occupyPort(9990);
      
      // With maxAttempts=2, should only try 9989 and 9990, then fail
      await expect(
        PortFinder.findAvailablePort(9989, 2)
      ).rejects.toThrow('Could not find an available port');
    });
  });

  describe('findPortWithFallback', () => {
    describe('when port is available', () => {
      it('should return requested port with wasRequested=true', async () => {
        const result = await PortFinder.findPortWithFallback(9988, false);
        expect(result.port).toBe(9988);
        expect(result.wasRequested).toBe(true);
      });

      it('should return requested port regardless of userSuppliedPort flag', async () => {
        const result1 = await PortFinder.findPortWithFallback(9987, true);
        expect(result1.port).toBe(9987);
        expect(result1.wasRequested).toBe(true);

        const result2 = await PortFinder.findPortWithFallback(9986, false);
        expect(result2.port).toBe(9986);
        expect(result2.wasRequested).toBe(true);
      });
    });

    describe('when port is not available and userSuppliedPort=false', () => {
      it('should find next available port', async () => {
        await occupyPort(9985);
        
        const result = await PortFinder.findPortWithFallback(9985, false);
        expect(result.port).toBe(9986);
        expect(result.wasRequested).toBe(false);
      });

      it('should skip multiple occupied ports', async () => {
        await occupyPort(9984);
        await occupyPort(9985);
        await occupyPort(9986);
        
        const result = await PortFinder.findPortWithFallback(9984, false);
        expect(result.port).toBe(9987);
        expect(result.wasRequested).toBe(false);
      });
    });

    describe('when port is not available and userSuppliedPort=true', () => {
      it('should throw error with helpful message', async () => {
        await occupyPort(9983);
        
        await expect(
          PortFinder.findPortWithFallback(9983, true)
        ).rejects.toThrow('Port 9983 is already in use');
        
        await expect(
          PortFinder.findPortWithFallback(9983, true)
        ).rejects.toThrow('Please choose a different port using --port flag');
      });
    });
  });
});
