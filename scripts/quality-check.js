#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * MECE品質チェックスクリプト
 * 
 * 【分類】
 * 1. 構造的品質 (Structural Quality)
 * 2. セキュリティ品質 (Security Quality) 
 * 3. 機能的品質 (Functional Quality)
 * 4. 保守性品質 (Maintainability Quality)
 */

class MECEQualityChecker {
  constructor() {
    this.results = {
      structural: { passed: 0, failed: 0, issues: [] },
      security: { passed: 0, failed: 0, issues: [] },
      functional: { passed: 0, failed: 0, issues: [] },
      maintainability: { passed: 0, failed: 0, issues: [] }
    };
  }

  /**
   * 1. 構造的品質チェック
   */
  checkStructuralQuality(filePath, content) {
    const issues = [];

    // Page Object Model の使用
    if (filePath.includes('.spec.ts')) {
      const hasPageObjectImport = /import.*from.*['"]\.\/.*(Page|page)['"]/i.test(content);
      if (!hasPageObjectImport) {
        issues.push({
          type: 'STRUCTURAL',
          severity: 'HIGH',
          message: 'Page Object Modelが使用されていません',
          file: filePath
        });
      }
    }

    // BasePage継承の確認
    if (filePath.includes('Page.ts') && !filePath.includes('BasePage.ts')) {
      const extendsBasePage = /extends\s+BasePage/i.test(content);
      if (!extendsBasePage) {
        issues.push({
          type: 'STRUCTURAL',
          severity: 'HIGH', 
          message: 'BasePageを継承していません',
          file: filePath
        });
      }
    }

    return issues;
  }

  /**
   * 2. セキュリティ品質チェック
   */
  checkSecurityQuality(filePath, content) {
    const issues = [];

    // ハードコーディング検出（テスト用ダミー値を除外）
    const hardcodedPatterns = [
      /password\s*[=:]\s*['"][^'"]*['"]/gi,
      /fill\(['"][^'"]*@[^'"]*\.(com|org)[^'"]*['"]\)/gi,
      /apikey\s*[=:]\s*['"][^'"]*['"]/gi
    ];

    hardcodedPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        // テスト用ダミー値を除外
        const realIssues = matches.filter(match => 
          !match.includes('TEST_DUMMY') && 
          !match.includes('DUMMY_') &&
          !match.includes('process.env')
        );
        
        if (realIssues.length > 0) {
          issues.push({
            type: 'SECURITY',
            severity: 'CRITICAL',
            message: `機密情報のハードコーディング: ${realIssues.join(', ')}`,
            file: filePath
          });
        }
      }
    });

    // 環境変数使用の推奨
    if (filePath.includes('.spec.ts') || filePath.includes('Page.ts')) {
      const hasEnvUsage = /process\.env\./i.test(content);
      if (!hasEnvUsage && (content.includes('password') || content.includes('email'))) {
        issues.push({
          type: 'SECURITY',
          severity: 'MEDIUM',
          message: '環境変数の使用を推奨します',
          file: filePath
        });
      }
    }

    return issues;
  }

  /**
   * 3. 機能的品質チェック
   */
  checkFunctionalQuality(filePath, content) {
    const issues = [];

    // セレクター戦略の確認
    const preferredSelectors = /getByRole|getByLabel|getByText|getByTestId/gi;
    const cssSelectors = /locator\(['"][#.].*['"]\)/gi;
    
    const preferredMatches = content.match(preferredSelectors) || [];
    const cssMatches = content.match(cssSelectors) || [];

    if (cssMatches.length > preferredMatches.length) {
      issues.push({
        type: 'FUNCTIONAL',
        severity: 'MEDIUM',
        message: 'CSS セレクターよりも Role-based セレクターを推奨',
        file: filePath
      });
    }

    // エラーハンドリングの確認
    if (filePath.includes('.spec.ts') || filePath.includes('Page.ts')) {
      const hasTryCatch = /try\s*{[\s\S]*?}\s*catch/gi.test(content);
      const hasHandleError = /handleError/gi.test(content);
      
      if (!hasTryCatch && !hasHandleError) {
        issues.push({
          type: 'FUNCTIONAL',
          severity: 'MEDIUM',
          message: 'エラーハンドリングの実装を推奨',
          file: filePath
        });
      }
    }

    return issues;
  }

  /**
   * 4. 保守性品質チェック  
   */
  checkMaintainabilityQuality(filePath, content) {
    const issues = [];

    // 日本語テスト名の確認
    if (filePath.includes('.spec.ts')) {
      const testMatches = content.match(/test\(['"][^'"]*['"]/g) || [];
      const japaneseTestCount = testMatches.filter(test => 
        /[ひらがなカタカナ漢字]/.test(test)
      ).length;

      if (testMatches.length > 0 && japaneseTestCount / testMatches.length < 0.8) {
        issues.push({
          type: 'MAINTAINABILITY',
          severity: 'LOW',
          message: '日本語テスト名の使用を推奨（現在の日本語率: ' + 
                   Math.round(japaneseTestCount / testMatches.length * 100) + '%）',
          file: filePath
        });
      }
    }

    // コメントの品質確認
    const whyComments = content.match(/\/\*\*[\s\S]*?なぜ[\s\S]*?\*\//gi) || [];
    const totalMethods = content.match(/async\s+\w+\s*\(/g) || [];
    
    if (totalMethods.length > 3 && whyComments.length === 0) {
      issues.push({
        type: 'MAINTAINABILITY',
        severity: 'LOW',
        message: '「なぜ」を説明するコメントの追加を推奨',
        file: filePath
      });
    }

    return issues;
  }

  /**
   * ファイル品質チェック実行
   */
  checkFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      const structuralIssues = this.checkStructuralQuality(filePath, content);
      const securityIssues = this.checkSecurityQuality(filePath, content);  
      const functionalIssues = this.checkFunctionalQuality(filePath, content);
      const maintainabilityIssues = this.checkMaintainabilityQuality(filePath, content);

      // 結果を分類別に集計
      this.results.structural.issues.push(...structuralIssues);
      this.results.security.issues.push(...securityIssues);
      this.results.functional.issues.push(...functionalIssues);
      this.results.maintainability.issues.push(...maintainabilityIssues);

      // パス/失敗の判定
      const allIssues = [...structuralIssues, ...securityIssues, ...functionalIssues, ...maintainabilityIssues];
      const hasCriticalIssues = allIssues.some(issue => issue.severity === 'CRITICAL');
      
      if (hasCriticalIssues) {
        this.results.structural.failed++;
        this.results.security.failed++;
        this.results.functional.failed++;
        this.results.maintainability.failed++;
      } else {
        this.results.structural.passed++;
        this.results.security.passed++;
        this.results.functional.passed++;
        this.results.maintainability.passed++;
      }

      return allIssues;
    } catch (error) {
      console.error(`ファイル読み取りエラー: ${filePath}`, error.message);
      return [];
    }
  }

  /**
   * プロジェクト全体のチェック実行
   */
  async checkProject() {
    console.log('🔍 MECE品質チェック開始...\n');

    // TypeScriptファイルを検索
    const tsFiles = [
      'tests/**/*.ts',
      'tests/**/*.spec.ts',
      '!node_modules/**',
      '!test-results/**',
      '!tests/archive/**'  // アーカイブフォルダを除外
    ];
    
    console.log('🗂️ アーカイブフォルダ (tests/archive/) は品質チェック対象外です');

    let allFiles = [];
    for (const pattern of tsFiles) {
      const files = glob.sync(pattern, { cwd: process.cwd() });
      allFiles.push(...files);
    }

    // 重複除去とアーカイブフォルダの除外
    allFiles = [...new Set(allFiles)];
    allFiles = allFiles.filter(file => !file.includes('tests/archive/'));

    console.log(`📁 チェック対象ファイル数: ${allFiles.length}\n`);

    // 各ファイルをチェック
    let totalIssues = 0;
    for (const file of allFiles) {
      const issues = this.checkFile(file);
      totalIssues += issues.length;

      if (issues.length > 0) {
        console.log(`❌ ${file}:`);
        issues.forEach(issue => {
          const icon = issue.severity === 'CRITICAL' ? '🚨' : 
                      issue.severity === 'HIGH' ? '⚠️' : 
                      issue.severity === 'MEDIUM' ? '📝' : '💡';
          console.log(`   ${icon} [${issue.type}] ${issue.message}`);
        });
        console.log('');
      }
    }

    // 結果レポート出力
    this.generateReport(allFiles.length, totalIssues);
  }

  /**
   * MECE品質レポート生成
   */
  generateReport(totalFiles, totalIssues) {
    console.log('📊 === MECE品質チェック結果 ===\n');
    
    console.log(`📋 全体サマリー:`);
    console.log(`   チェックファイル数: ${totalFiles}`);
    console.log(`   総問題数: ${totalIssues}`);
    console.log('');

    // カテゴリ別結果
    const categories = [
      { name: '構造的品質', key: 'structural', icon: '🏗️' },
      { name: 'セキュリティ品質', key: 'security', icon: '🔒' },
      { name: '機能的品質', key: 'functional', icon: '⚙️' },
      { name: '保守性品質', key: 'maintainability', icon: '📝' }
    ];

    categories.forEach(category => {
      const result = this.results[category.key];
      const total = result.passed + result.failed;
      const passRate = total > 0 ? Math.round((result.passed / total) * 100) : 100;
      
      console.log(`${category.icon} ${category.name}:`);
      console.log(`   合格率: ${passRate}% (${result.passed}/${total})`);
      console.log(`   問題数: ${result.issues.length}`);
      
      if (result.issues.length > 0) {
        const criticalCount = result.issues.filter(i => i.severity === 'CRITICAL').length;
        const highCount = result.issues.filter(i => i.severity === 'HIGH').length;
        const mediumCount = result.issues.filter(i => i.severity === 'MEDIUM').length;
        const lowCount = result.issues.filter(i => i.severity === 'LOW').length;
        
        if (criticalCount > 0) console.log(`     🚨 重大: ${criticalCount}`);
        if (highCount > 0) console.log(`     ⚠️ 高: ${highCount}`);
        if (mediumCount > 0) console.log(`     📝 中: ${mediumCount}`);
        if (lowCount > 0) console.log(`     💡 低: ${lowCount}`);
      }
      console.log('');
    });

    // 総合評価
    const overallScore = this.calculateOverallScore();
    console.log(`🎯 総合品質スコア: ${overallScore}/100`);
    
    if (overallScore >= 90) {
      console.log('✅ 優秀な品質レベルです！');
    } else if (overallScore >= 75) {
      console.log('👍 良好な品質レベルです');
    } else if (overallScore >= 60) {
      console.log('⚠️ 改善の余地があります');
    } else {
      console.log('🚨 品質改善が必要です');
    }

    // 終了コードの設定
    const criticalIssues = Object.values(this.results)
      .flatMap(r => r.issues)
      .filter(issue => issue.severity === 'CRITICAL');
    
    if (criticalIssues.length > 0) {
      console.log('\n🚨 重大な問題が検出されました。修正が必要です。');
      process.exit(1);
    }
  }

  /**
   * 総合品質スコア計算
   */
  calculateOverallScore() {
    const weights = {
      structural: 0.3,
      security: 0.4,
      functional: 0.2,  
      maintainability: 0.1
    };

    let weightedScore = 0;
    Object.entries(this.results).forEach(([key, result]) => {
      const total = result.passed + result.failed;
      const score = total > 0 ? (result.passed / total) * 100 : 100;
      weightedScore += score * weights[key];
    });

    return Math.round(weightedScore);
  }
}

// スクリプト実行
if (require.main === module) {
  const checker = new MECEQualityChecker();
  checker.checkProject().catch(console.error);
}

module.exports = MECEQualityChecker;
