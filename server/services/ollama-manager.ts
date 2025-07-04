import { spawn, ChildProcess } from "child_process";
import { platform } from "os";

interface OllamaStatus {
  running: boolean;
  pid?: number;
  uptime?: number;
  models?: any[];
}

class OllamaManager {
  private process: ChildProcess | null = null;
  private startTime: number | null = null;

  async checkStatus(): Promise<OllamaStatus> {
    try {
      // Check if Ollama API is responding
      const response = await fetch("http://localhost:11434/api/tags");
      if (!response.ok) {
        return { running: false };
      }
      
      const data = await response.json();
      const uptime = this.startTime ? Date.now() - this.startTime : undefined;
      
      return {
        running: true,
        pid: this.process?.pid,
        uptime,
        models: data.models || []
      };
    } catch (error) {
      return { running: false };
    }
  }

  async start(): Promise<{ success: boolean; pid?: number; error?: string }> {
    // Check if already running
    const status = await this.checkStatus();
    if (status.running) {
      return { success: false, error: "Ollama is already running" };
    }

    try {
      const isWindows = platform() === "win32";
      
      // Set environment variables to prevent model re-download
      const env = {
        ...process.env,
        OLLAMA_NOPRUNE: "true",
      };

      let command: string;
      let args: string[];
      let options: any;

      if (isWindows) {
        command = "ollama";
        args = ["serve"];
        options = {
          detached: true,
          stdio: ["ignore", "pipe", "pipe"],
          shell: true,
          env
        };
      } else {
        command = "ollama";
        args = ["serve"];
        options = {
          detached: true,
          stdio: ["ignore", "pipe", "pipe"],
          env
        };
      }

      this.process = spawn(command, args, options);
      this.startTime = Date.now();

      // Handle process events
      this.process.on("error", (error) => {
        console.error("Ollama process error:", error);
        this.process = null;
        this.startTime = null;
      });

      this.process.on("exit", (code, signal) => {
        console.log(`Ollama process exited with code ${code}, signal ${signal}`);
        this.process = null;
        this.startTime = null;
      });

      // Allow the process to run independently
      this.process.unref();

      // Wait a moment for the process to start
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify the process started successfully
      const finalStatus = await this.checkStatus();
      
      if (finalStatus.running) {
        return { success: true, pid: this.process?.pid };
      } else {
        return { success: false, error: "Failed to start Ollama server" };
      }
    } catch (error) {
      console.error("Failed to start Ollama:", error);
      return { 
        success: false, 
        error: `Failed to start Ollama: ${(error as Error).message}` 
      };
    }
  }

  async stop(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.process && this.process.pid) {
        this.process.kill();
        this.process = null;
        this.startTime = null;
        return { success: true };
      } else {
        return { success: false, error: "No Ollama process found" };
      }
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to stop Ollama: ${(error as Error).message}` 
      };
    }
  }

  async waitForReady(timeout: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const status = await this.checkStatus();
      if (status.running) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return false;
  }
}

export const ollamaManager = new OllamaManager();