import Link from "next/link";

export const metadata = {
  title: "プライバシーポリシー | TORU",
  description: "TORU（建設業向け図面解析サービス）のプライバシーポリシー",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-dvh" style={{ background: "var(--color-bg)" }}>
      <header
        className="px-6 py-4"
        style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white"
              style={{ background: "var(--color-primary)" }}
            >
              T
            </div>
            <span className="font-bold tracking-wide" style={{ color: "var(--color-text)" }}>
              TORU
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium hover:underline"
            style={{ color: "var(--color-text-muted)" }}
          >
            トップへ
          </Link>
        </div>
      </header>

      <article className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
          プライバシーポリシー
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
          最終更新日：2026年5月12日
        </p>

        <Section title="1. はじめに">
          <p>
            TORU（以下「本サービス」）は、建設現場向けの図面解析サービスです。
            本ポリシーは、本サービスにおける個人情報の取り扱いについて定めるものです。
          </p>
        </Section>

        <Section title="2. 取得する情報">
          <ul className="list-disc space-y-1 pl-5">
            <li>アカウント情報：メールアドレス、表示名、所属する会社情報</li>
            <li>サービス利用情報：作成した見積書、単価マスタ、グループへの参加状況、グループ内のメッセージ</li>
            <li>図面解析データ：アップロードされたPDFファイル、AIによる解析結果</li>
            <li>ログ情報：操作ログ、エラーログ、アクセス情報（IPアドレス・ブラウザ情報など）</li>
          </ul>
        </Section>

        <Section title="3. 利用目的">
          <ul className="list-disc space-y-1 pl-5">
            <li>本サービスの提供・運営・品質改善</li>
            <li>図面解析処理および結果の表示</li>
            <li>ユーザーサポート対応</li>
            <li>不正利用の防止・セキュリティ確保</li>
            <li>本サービスに関するお知らせ</li>
          </ul>
        </Section>

        <Section title="4. 外部サービスへの情報提供">
          <p className="mb-3">
            本サービスは以下の外部サービスを利用しており、機能提供のために必要な範囲で情報を送信します。
          </p>

          <h3 className="mt-4 font-semibold" style={{ color: "var(--color-text)" }}>
            ① Supabase（インフラ・データベース）
          </h3>
          <p className="mt-1 text-sm">
            アカウント情報・サービス利用情報・図面ファイルは、Supabase Inc.（米国）が提供するクラウド基盤に保存されます。
            保存データは暗号化（AES-256）され、通信はすべてTLS（HTTPS）で保護されます。
          </p>

          <h3 className="mt-4 font-semibold" style={{ color: "var(--color-text)" }}>
            ② Anthropic Claude API（AI解析）
          </h3>
          <p className="mt-1 text-sm">
            図面PDFは解析実行時にAnthropic, Inc.（米国）のClaude APIに送信され、AIが内容を解析します。
            Anthropicの利用規約により、APIに送信されたデータはAIモデルの学習には使用されません。
            データはAnthropic側で最大30日間保持された後、削除されます（不正利用検出のため）。
          </p>

          <div
            className="mt-4 rounded-lg p-3 text-sm"
            style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)" }}
          >
            <p className="font-semibold" style={{ color: "#B45309" }}>
              ⚠️ 図面に含まれる第三者の個人情報について
            </p>
            <p className="mt-1" style={{ color: "var(--color-text-muted)" }}>
              施工図面にはお客様や関係者の氏名・住所・連絡先などが記載されている場合があります。
              本サービスでは現時点で図面内の個人情報の自動マスキング機能は提供していません。
              機密性の高い情報を含む図面のアップロードは慎重にご判断ください。
              将来的には自動マスキング機能の実装を予定しています。
            </p>
          </div>
        </Section>

        <Section title="5. 第三者への提供">
          <p>
            法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
          </p>
        </Section>

        <Section title="6. データの保存期間">
          <ul className="list-disc space-y-1 pl-5">
            <li>アカウント情報・サービス利用情報：アカウント削除まで保持</li>
            <li>図面ファイル・解析結果：ユーザー自身で削除可能。削除後は論理削除され、一定期間経過後にバックアップから完全削除</li>
            <li>ログ情報：最大1年</li>
          </ul>
        </Section>

        <Section title="7. ユーザーの権利">
          <p className="mb-2">
            ユーザーはご自身の個人情報について以下の権利を有します。
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>保有データの確認・開示の請求</li>
            <li>誤った情報の訂正の請求</li>
            <li>アカウントおよび関連データの削除の請求</li>
            <li>本サービスの利用停止</li>
          </ul>
          <p className="mt-2">
            上記の請求は下記の「お問い合わせ」までご連絡ください。
          </p>
        </Section>

        <Section title="8. セキュリティ対策">
          <ul className="list-disc space-y-1 pl-5">
            <li>通信のTLS暗号化（HTTPS）</li>
            <li>データベース保存時の暗号化（AES-256）</li>
            <li>パスワードのハッシュ化保存（bcrypt）</li>
            <li>アクセス権限の最小化（行レベルセキュリティ）</li>
          </ul>
        </Section>

        <Section title="9. 本ポリシーの変更">
          <p>
            本ポリシーの内容は、法令の改正やサービス内容の変更等に伴い、予告なく変更することがあります。
            重要な変更がある場合はサービス内またはメールでお知らせします。
          </p>
        </Section>

        <Section title="10. お問い合わせ">
          <p>
            本ポリシーに関するお問い合わせは、サービス内のフィードバック機能、または以下までご連絡ください。
          </p>
          <p className="mt-2 font-mono text-sm" style={{ color: "var(--color-text-muted)" }}>
            ahoyu1031@gmail.com
          </p>
        </Section>

        <div className="mt-12 border-t pt-6 text-center text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-subtle)" }}>
          © 2026 TORU
        </div>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
        {title}
      </h2>
      <div
        className="mt-3 text-sm leading-relaxed"
        style={{ color: "var(--color-text-muted)" }}
      >
        {children}
      </div>
    </section>
  );
}
