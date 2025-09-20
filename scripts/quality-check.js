#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * MECE品質チェックスクリプト
 * 
 * 【なぜこのスクリプトが必要か】
 * 1. 一貫性: 全開発者が同じ品質基準でコードを書くため
 * 2. 効率性: 手動レビューでは見落としがちな問題を自動検出
 * 3. 教育効果: 品質問題を指摘することで開発者のスキル向上
 * 4. CI/CD統合: 継続的インテグレーションでの品質ゲート
 * 
 * 【MECE分類の理由】
 * 1. 構造的品質 (Structural Quality) - アーキテクチャの一貫性
 * 2. セキュリティ品質 (Security Quality) - 機密情報の安全性
 * 3. 機能的品質 (Functional Quality) - テストの実行可能性・信頼性
 * 4. 保守性品質 (Maintainability Quality) - 長期的な保守・拡張性
 */

class MECEQualityChecker {
  /**
   * MECEQualityCheckerのコンストラクター
   * 
   * 【なぜこの状態管理構造にするか】
   * 1. 分離された品質追跡: 各品質カテゴリを独立して測定・改善可能
   * 2. 集計効率: passed/failed/issuesの構造化で高速なレポート生成
   * 3. 拡張性: 新しい品質カテゴリを容易に追加できる設計
   * 4. データ整合性: 一貫したデータ構造で実行時エラーを防止
   */
  constructor() {
    this.results = {
      // 構造的品質: アーキテクチャの一貫性を追跡
      // 目的: Page Object Model、BasePage継承等の設計パターン遵守
      structural: { passed: 0, failed: 0, issues: [] },
      
      // セキュリティ品質: 機密情報の安全性を追跡  
      // 目的: ハードコーディング防止、環境変数使用の徹底
      security: { passed: 0, failed: 0, issues: [] },
      
      // 機能的品質: テストの実行可能性・信頼性を追跡
      // 目的: セレクター戦略、エラーハンドリングの適切な実装
      functional: { passed: 0, failed: 0, issues: [] },
      
      // 保守性品質: 長期的な保守・拡張性を追跡
      // 目的: 日本語テスト名、説明コメントによる可読性向上
      maintainability: { passed: 0, failed: 0, issues: [] }
    };
  }

  /**
   * 1. 構造的品質チェック
   * 
   * 【なぜ構造的品質が重要か】
   * 1. 保守性: 統一されたアーキテクチャで修正コストを削減
   * 2. 学習コスト: 新規参加者が理解しやすいコード構造
   * 3. バグ予防: 一貫したパターンでヒューマンエラーを防止
   * 4. 拡張性: 新機能追加時の設計指針を明確化
   */
  checkStructuralQuality(filePath, content) {
    const issues = [];

    // Page Object Model の使用チェック
    // 【実装方針】正規表現でimport文からPage Object使用を検出
    // 【なぜ.spec.tsのみチェックか】テストファイルでのみPage Object使用が必須
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
    // 【実装方針】extends キーワードでBasePage継承を検出
    // 【なぜBasePage.ts除外か】基底クラス自体は継承不要
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
   * 
   * 【なぜセキュリティ品質が最重要か】
   * 1. 情報漏洩防止: 認証情報の適切な管理でセキュリティ事故を防ぐ
   * 2. コンプライアンス: 企業のセキュリティポリシーへの準拠
   * 3. 信頼性: 顧客・ステークホルダーからの信頼維持
   * 4. 法的リスク: 個人情報保護法等の法的要件への対応
   */
  checkSecurityQuality(filePath, content) {
    const issues = [];

    // ハードコーディング検出（テスト用ダミー値を除外）
    // 【実装方針】正規表現パターンマッチングで機密情報を検出
    // 【なぜ複数パターンか】password、email、apikey等の様々な機密情報をカバー
    const hardcodedPatterns = [
      /password\s*[=:]\s*['"][^'"]*['"]/gi,  // パスワードの直接代入
      /fill\(['"][^'"]*@[^'"]*\.(com|org)[^'"]*['"]\)/gi,  // メールアドレスの直接入力
      /apikey\s*[=:]\s*['"][^'"]*['"]/gi  // APIキーの直接代入
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
   * 
   * 【なぜ機能的品質が重要か】
   * 1. テスト安定性: 適切なセレクター戦略でテストの脆弱性を削減
   * 2. 実行信頼性: エラーハンドリングでテスト失敗の原因を明確化
   * 3. アクセシビリティ: Role-basedセレクターで支援技術との互換性確保
   * 4. 保守効率: UI変更に強いテストコードで長期運用コストを削減
   */
  checkFunctionalQuality(filePath, content) {
    const issues = [];

    // セレクター戦略の確認
    // 【実装方針】推奨セレクターとCSS セレクターの使用比率を比較
    // 【なぜ比率で判定か】適度なCSS セレクター使用は許容、過度な使用を防止
    const preferredSelectors = /getByRole|getByLabel|getByText|getByTestId/gi;
    const cssSelectors = /locator\(['"][#.].*['"]\)/gi;  // ID(#)・クラス(.)セレクター検出
    
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
    // 【実装方針】try-catch文またはhandleErrorメソッドの存在をチェック
    // 【なぜ2つの方法か】try-catch（標準）とhandleError（BasePage統一API）の両方を許容
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
   * 
   * 【なぜ保守性品質が長期的に重要か】
   * 1. 可読性: 日本語テスト名でテスト意図を明確化、レビュー効率向上
   * 2. 知識継承: 「なぜ」コメントで設計意図を後続開発者に伝達
   * 3. デバッグ効率: 問題発生時の原因特定・修正時間を大幅短縮
   * 4. チーム生産性: 新規参加者の理解促進でオンボーディング時間削減
   */
  checkMaintainabilityQuality(filePath, content) {
    const issues = [];

    // 日本語テスト名の確認
    // 【実装方針】test()関数の文字列から日本語文字（ひらがな・カタカナ・漢字）を検出
    // 【なぜ80%基準か】完全日本語化は求めず、適度な日本語使用を推奨
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

    // Given-When-Then構造の確認
    // 【実装方針】GIVEN/WHEN/THENコメントの存在をチェック
    // 【なぜ構造化が重要か】テストの意図を明確化、保守性向上
    if (filePath.includes('.spec.ts')) {
      const hasGivenWhenThen = /===\s*(GIVEN|WHEN|THEN)/gi.test(content);
      const testCount = (content.match(/test\(/g) || []).length;
      
      if (testCount > 0 && !hasGivenWhenThen) {
        issues.push({
          type: 'MAINTAINABILITY',
          severity: 'LOW',
          message: 'Given-When-Then構造の使用を推奨（テストの意図明確化）',
          file: filePath
        });
      }
    }

    // アサーション数の確認
    // 【実装方針】expect()の数をカウントして過度なアサーションを検出
    // 【なぜ5個制限か】1つのテストは1つの責任、過度なアサーションは分割を推奨
    if (filePath.includes('.spec.ts')) {
      const expectCount = (content.match(/await expect\(/g) || []).length + 
                         (content.match(/expect\(/g) || []).length;
      
      if (expectCount > 5) {
        issues.push({
          type: 'MAINTAINABILITY',
          severity: 'LOW',
          message: `アサーション数が多すぎます（${expectCount}個）。テスト分割を検討してください`,
          file: filePath
        });
      }
    }

    // コメントの品質確認
    // 【実装方針】「なぜ」を含むJSDocコメントとasync関数の比率をチェック
    // 【なぜ3メソッド以上か】小さなクラスには過度なコメントを求めない
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
   * 
   * 【なぜこの実装方針にするか】
   * 1. 単一責任: 1ファイルの品質チェックのみに集中
   * 2. 組み合わせ: 4つの品質カテゴリを統合して総合評価
   * 3. エラー安全性: ファイル読み取り失敗時の適切な例外処理
   * 4. 結果集計: 品質カテゴリ別の統計情報を自動更新
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
   * 
   * 【なぜ非同期処理にするか】
   * 1. 拡張性: 将来的な外部API連携（ESLint、SonarQube等）に対応
   * 2. パフォーマンス: 大量ファイル処理時の並列化可能性
   * 3. エラーハンドリング: 非同期エラーの適切な処理
   * 4. 一貫性: Node.jsのベストプラクティスに準拠
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
   * 
   * 【なぜこのレポート形式にするか】
   * 1. 視覚的理解: アイコンと色分けで問題の重要度を直感的に表示
   * 2. 意思決定支援: 数値とパーセンテージで改善優先度を明確化
   * 3. 進捗追跡: 継続的な品質改善の効果測定を可能に
   * 4. ステークホルダー報告: 非技術者にも理解しやすい形式
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
   * 
   * 【なぜ重み付けスコアを使用するか】
   * 1. 優先順位: セキュリティ(40%)を最重視、構造(30%)、機能(20%)、保守性(10%)
   * 2. 実用性: ビジネスインパクトの大きさに応じた評価
   * 3. 意思決定支援: 限られたリソースをどこに投入すべきかを明確化
   * 4. 継続改善: 定量的な指標で改善効果を測定可能
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
