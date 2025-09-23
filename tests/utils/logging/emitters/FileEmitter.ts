/**
 * FileEmitter - ファイル出力用Emitter
 * ローテーション機能と圧縮機能を持つ本格的なファイルログ
 */

import { promises as fs } from "fs";
import { createWriteStream, WriteStream } from "fs";
import { createGzip } from "zlib";
import { pipeline } from "stream";
import { promisify } from "util";
import * as path from "path";
import { LogEmitter, LogEntry, LogLevel } from "../../../types";

const pipelineAsync = promisify(pipeline);

interface FileEmitterConfig {
  directory: string;
  maxFileSize: number; // MB
  maxFiles: number;
  compress: boolean;
  filePattern?: string; // デフォルト: 'test-{date}.log'
}

export class FileEmitter implements LogEmitter {
  private config: FileEmitterConfig;
  private currentStream?: WriteStream;
  private currentFilePath?: string;
  private currentFileSize: number = 0;
  private writeBuffer: string[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: FileEmitterConfig) {
    this.config = {
      filePattern: "test-{date}.log",
      ...config,
    };
    this.ensureDirectory();
    this.setupFlushTimer();
  }

  /**
   * ログエントリをファイルに出力
   */
  async emit(entry: LogEntry): Promise<void> {
    const logLine = this.formatLogLine(entry);
    this.writeBuffer.push(logLine);

    // バッファが一定サイズに達したら即座にフラッシュ
    if (this.writeBuffer.length >= 10) {
      await this.flush();
    }
  }

  /**
   * ログラインのフォーマット
   */
  private formatLogLine(entry: LogEntry): string {
    const basicInfo = {
      timestamp: entry.timestamp,
      level: LogLevel[entry.level],
      category: entry.category,
      message: entry.message,
      correlationId: entry.metadata.correlationId,
    };

    // コンテキスト情報を追加
    const logData = {
      ...basicInfo,
      ...(entry.context && { context: entry.context }),
      ...(entry.error && { error: entry.error }),
      metadata: entry.metadata,
    };

    return JSON.stringify(logData) + "\n";
  }

  /**
   * バッファの内容をファイルに書き込み
   */
  async flush(): Promise<void> {
    if (this.writeBuffer.length === 0) {
      return;
    }

    const linesToWrite = [...this.writeBuffer];
    this.writeBuffer = [];

    try {
      await this.ensureCurrentStream();

      if (!this.currentStream) {
        throw new Error("ファイルストリームの初期化に失敗");
      }

      for (const line of linesToWrite) {
        const written = await this.writeToStream(line);
        this.currentFileSize += written;
      }

      // ファイルサイズチェックとローテーション
      if (this.currentFileSize > this.config.maxFileSize * 1024 * 1024) {
        await this.rotateFile();
      }
    } catch (error) {
      console.error("ファイル書き込みエラー:", error);
      // エラー時はバッファに戻す
      this.writeBuffer.unshift(...linesToWrite);
    }
  }

  /**
   * ストリームへの書き込み（Promise版）
   */
  private writeToStream(data: string): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.currentStream) {
        reject(new Error("ストリームが初期化されていません"));
        return;
      }

      this.currentStream.write(data, "utf8", (error?: Error | null) => {
        if (error) {
          reject(error);
        } else {
          resolve(Buffer.byteLength(data, "utf8"));
        }
      });
    });
  }

  /**
   * 現在のストリームの確保
   */
  private async ensureCurrentStream(): Promise<void> {
    if (this.currentStream && !this.currentStream.destroyed) {
      return;
    }

    const fileName = this.generateFileName();
    const filePath = path.join(this.config.directory, fileName);

    this.currentStream = createWriteStream(filePath, { flags: "a" });
    this.currentFilePath = filePath;
    this.currentFileSize = await this.getFileSize(filePath);
  }

  /**
   * ファイル名の生成
   */
  private generateFileName(): string {
    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const sessionId = Date.now(); // セッション識別用

    return this.config
      .filePattern!.replace("{date}", date)
      .replace("{session}", sessionId.toString());
  }

  /**
   * ファイルサイズの取得
   */
  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch {
      return 0; // ファイルが存在しない場合
    }
  }

  /**
   * ファイルローテーション
   */
  private async rotateFile(): Promise<void> {
    if (!this.currentStream || !this.currentFilePath) {
      return;
    }

    // 現在のストリームをクローズ
    await this.closeCurrentStream();

    // 圧縮処理（設定により）
    if (this.config.compress) {
      await this.compressFile(this.currentFilePath);
    }

    // 古いファイルの削除
    await this.cleanupOldFiles();

    // 新しいストリームの準備
    this.currentFileSize = 0;
    await this.ensureCurrentStream();
  }

  /**
   * 現在のストリームをクローズ
   */
  private closeCurrentStream(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.currentStream) {
        resolve();
        return;
      }

      this.currentStream.end((error?: Error | null) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * ファイルの圧縮
   */
  private async compressFile(filePath: string): Promise<void> {
    try {
      const gzipPath = `${filePath}.gz`;
      const readStream = createReadStream(filePath);
      const writeStream = createWriteStream(gzipPath);
      const gzipStream = createGzip();

      await pipelineAsync(readStream, gzipStream, writeStream);
      await fs.unlink(filePath); // 元ファイルを削除
    } catch (error) {
      console.error(`ファイル圧縮エラー (${filePath}):`, error);
    }
  }

  /**
   * 古いファイルのクリーンアップ
   */
  private async cleanupOldFiles(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.directory);
      const logFiles = files
        .filter(
          (file) =>
            file.includes("test-") &&
            (file.endsWith(".log") || file.endsWith(".log.gz"))
        )
        .map((file) => ({
          name: file,
          path: path.join(this.config.directory, file),
          stat: null as any,
        }));

      // ファイル情報を取得
      for (const file of logFiles) {
        try {
          file.stat = await fs.stat(file.path);
        } catch {
          // ファイルが読めない場合はスキップ
        }
      }

      // 有効なファイルのみフィルタリングし、作成日時でソート
      const validFiles = logFiles
        .filter((file) => file.stat)
        .sort((a, b) => b.stat.ctime.getTime() - a.stat.ctime.getTime());

      // maxFilesを超えるファイルを削除
      if (validFiles.length > this.config.maxFiles) {
        const filesToDelete = validFiles.slice(this.config.maxFiles);

        for (const file of filesToDelete) {
          try {
            await fs.unlink(file.path);
          } catch (error) {
            console.error(`古いログファイル削除エラー (${file.name}):`, error);
          }
        }
      }
    } catch (error) {
      console.error("ログファイルクリーンアップエラー:", error);
    }
  }

  /**
   * ディレクトリの確保
   */
  private async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.directory, { recursive: true });
    } catch (error) {
      console.error("ログディレクトリ作成エラー:", error);
      throw error;
    }
  }

  /**
   * 定期フラッシュタイマーの設定
   */
  private setupFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch((error: Error) => {
        console.error("定期フラッシュエラー:", error);
      });
    }, 5000); // 5秒間隔
  }

  /**
   * リソースのクリーンアップ
   */
  async close(): Promise<void> {
    // タイマーをクリア
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // 残りのバッファをフラッシュ
    await this.flush();

    // ストリームをクローズ
    await this.closeCurrentStream();
  }
}

// ReadStreamの型定義を追加（TypeScriptコンパイラ対応）
function createReadStream(path: string): import("stream").Readable {
  return require("fs").createReadStream(path);
}
