"use client";

const TAX_RATE = 0.1;
const MIN_ROWS = 14;

type Quote = {
  id: string;
  project_name: string | null;
  client_name: string | null;
  quote_date: string | null;
  total_amount: number;
  created_at: string;
  delivery_date?: string | null;
  delivery_location?: string | null;
  payment_terms?: string | null;
  valid_until?: string | null;
  notes?: string | null;
};

type QuoteItem = {
  id: string;
  material_name: string;
  unit: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

type Company = {
  name: string;
  postal_code?: string | null;
  address?: string | null;
  tel?: string | null;
  fax?: string | null;
  contact_name?: string | null;
} | null;

function toWareki(dateStr: string | null): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const reiwa = y - 2018;
  return `令和　${reiwa}年　${m}月　${day}日`;
}

export function PrintView({
  quote,
  items,
  company,
  quoteNo,
}: {
  quote: Quote;
  items: QuoteItem[];
  company: Company;
  quoteNo: string;
}) {
  const subtotal = Number(quote.total_amount);
  const tax = Math.floor(subtotal * TAX_RATE);
  const totalWithTax = subtotal + tax;
  const emptyCount = Math.max(0, MIN_ROWS - items.length);

  const conditions = [
    { label: "1. 受渡期日", value: quote.delivery_date ?? "" },
    { label: "2. 納入場所",  value: quote.delivery_location ?? "" },
    { label: "3. 支払条件", value: quote.payment_terms ?? "" },
    { label: "4. 有効期限", value: quote.valid_until ?? "" },
  ];

  const border = "1px solid #000";
  const mincho = "'Noto Serif JP', 'Yu Mincho', 'Hiragino Mincho Pro', 'MS Mincho', serif";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&display=swap');
        @page { size: A4; margin: 10mm 14mm; }
        @media print {
          html, body {
            overflow: visible !important;
            height: auto !important;
            background: white !important;
          }
          /* サイドバー・ヘッダー等アプリUIを完全非表示 */
          body * { visibility: hidden !important; }
          /* 見積書ドキュメントだけ表示 */
          .print-doc, .print-doc * { visibility: visible !important; }
          .print-doc {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100% !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
        .dt { border-collapse: collapse; width: 100%; }
        .dt th, .dt td { border: ${border}; }
      `}</style>

      {/* toolbar */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
        <a href={`/quotes/${quote.id}`} className="text-sm text-gray-500 hover:underline">
          ← 見積書に戻る
        </a>
        <button
          onClick={() => window.print()}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[#1e40af] px-6 text-sm font-semibold text-white hover:bg-[#1e3a8a]"
        >
          PDFとして保存
        </button>
      </div>

      {/* document */}
      <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
        <div
          className="print-doc mx-auto max-w-[794px] bg-white shadow-xl"
          style={{ fontFamily: mincho, fontSize: "9.5pt" }}
        >
          {/* TORU accent line */}
          <div style={{ height: "3px", background: "#1e40af" }} />

          <div style={{ padding: "16px 24px 20px" }}>

            {/* ① タイトル行: お客様コードNo. | 御見積書 | No. */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span style={{ fontSize: "7.5pt", color: "#555" }}>お客様コードNo.</span>
              <h1 style={{ fontSize: "20pt", fontWeight: "bold", letterSpacing: "0.5em", textDecoration: "underline", textUnderlineOffset: "5px", margin: 0 }}>
                御　見　積　書
              </h1>
              <div style={{ textAlign: "right", fontSize: "8.5pt" }}>
                No.&nbsp;<span style={{ borderBottom: border, display: "inline-block", minWidth: "80px" }}>&nbsp;</span>
              </div>
            </div>

            {/* ② 日付: 右揃え */}
            <div style={{ textAlign: "right", fontSize: "9pt", marginTop: "2px", marginBottom: "10px" }}>
              {toWareki(quote.quote_date)}
            </div>

            {/* ③ 宛先（左）+ 発行者（中右） */}
            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
              {/* 左: 宛先（条件エリアと同じ幅 50%） */}
              <div style={{ flex: "0 0 50%" }}>
                {/* クライアント名 + 御中（アンダーラインが御中まで伸びる） */}
                <div style={{ display: "flex", alignItems: "flex-end", marginBottom: "4px" }}>
                  <span
                    style={{
                      fontSize: "13pt",
                      fontWeight: "bold",
                      borderBottom: "1.5px solid #000",
                      paddingBottom: "2px",
                      flex: 1,
                      display: "block",
                    }}
                  >
                    {quote.client_name || "　"}
                  </span>
                  <span style={{ fontSize: "10pt", fontWeight: "bold", paddingBottom: "2px", marginLeft: "8px", whiteSpace: "nowrap" }}>
                    御中
                  </span>
                </div>
                <div style={{ fontSize: "8.5pt", marginTop: "6px" }}>下記の通り御見積り申し上げます。</div>
              </div>

              {/* spacer: 50% client + 13% gap + 22% issuer + 15% remaining = 100% */}
              <div style={{ flex: "0 0 13%" }} />

              {/* 発行者情報（条件〜検印の間の位置に配置） */}
              <div style={{ flex: "0 0 22%", textAlign: "left", fontSize: "10pt", lineHeight: "1.8" }}>
                {company?.postal_code && <div>〒{company.postal_code}</div>}
                {company?.address && <div>{company.address}</div>}
                <div style={{ fontWeight: "bold" }}>{company?.name ?? ""}</div>
                {company?.tel && <div>TEL{company.tel}</div>}
                {company?.fax && <div>FAX{company.fax}</div>}
                {company?.contact_name && <div>{company.contact_name}</div>}
              </div>
            </div>

            {/* ④ 見積条件（左）+ 検印欄（右） */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              {/* 条件4行: ラベル + アンダーライン（全幅に伸びる） */}
              <div style={{ flex: "0 0 50%", fontSize: "8.5pt" }}>
                {conditions.map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", alignItems: "flex-end", marginBottom: "5px" }}>
                    <span style={{ whiteSpace: "nowrap", marginRight: "6px" }}>{label}</span>
                    <span
                      style={{
                        flex: 1,
                        borderBottom: "1px solid #000",
                        paddingBottom: "1px",
                        paddingLeft: "4px",
                        display: "block",
                        minWidth: "120px",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* 検印欄 */}
              <div style={{ display: "flex", flexShrink: 0 }}>
                {["検　印", "担当者印"].map((label) => (
                  <div
                    key={label}
                    style={{
                      border,
                      width: "52px",
                      height: "56px",
                      display: "flex",
                      flexDirection: "column",
                      fontSize: "7pt",
                      color: "#333",
                    }}
                  >
                    <div style={{ borderBottom: border, padding: "2px 4px", textAlign: "center" }}>{label}</div>
                    <div style={{ flex: 1 }} />
                  </div>
                ))}
              </div>
            </div>

            {/* ⑤ 御見積金額 */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "28px", margin: "8px 0 10px", fontSize: "12pt" }}>
              <span style={{ textDecoration: "underline", textUnderlineOffset: "4px", letterSpacing: "0.4em", fontWeight: "bold" }}>
                御 見 積 金 額
              </span>
              <span>
                <span style={{ fontSize: "13pt", fontWeight: "bold" }}>
                  ¥{subtotal.toLocaleString()}－
                </span>
                <span style={{ fontSize: "9pt", marginLeft: "6px" }}>（消費税別）</span>
              </span>
            </div>

            {/* ⑥ 明細テーブル */}
            <table className="dt" style={{ fontSize: "8.5pt", marginBottom: "8px" }}>
              <thead>
                <tr>
                  <th style={{ padding: "5px 8px", textAlign: "center", fontWeight: "bold", width: "50%" }}>品　　　　　名</th>
                  <th style={{ padding: "5px 4px", textAlign: "center", fontWeight: "bold", width: "10%" }}>数　量</th>
                  <th style={{ padding: "5px 4px", textAlign: "center", fontWeight: "bold", width: "7%" }}>単位</th>
                  <th style={{ padding: "5px 6px", textAlign: "center", fontWeight: "bold", width: "13%" }}>単　価</th>
                  <th style={{ padding: "5px 6px", textAlign: "center", fontWeight: "bold", width: "13%" }}>金　　額</th>
                  <th style={{ padding: "5px 6px", textAlign: "center", fontWeight: "bold", width: "7%" }}>備　考</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: "3px 8px" }}>{item.material_name}</td>
                    <td style={{ padding: "3px 4px", textAlign: "right" }}>
                      {Number(item.quantity).toLocaleString()}
                    </td>
                    <td style={{ padding: "3px 4px", textAlign: "center" }}>{item.unit ?? ""}</td>
                    <td style={{ padding: "3px 6px", textAlign: "right" }}>
                      {item.unit_price > 0 ? Number(item.unit_price).toLocaleString() : ""}
                    </td>
                    <td style={{ padding: "3px 6px", textAlign: "right" }}>
                      {Number(item.subtotal).toLocaleString()}
                    </td>
                    <td style={{ padding: "3px 6px" }} />
                  </tr>
                ))}
                {Array.from({ length: emptyCount }).map((_, i) => (
                  <tr key={`e${i}`} style={{ height: "20px" }}>
                    <td /><td /><td /><td /><td /><td />
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {[
                  ["小　　　計", subtotal.toLocaleString()],
                  ["消 費 税 等 ( 10 ％ )", tax.toLocaleString()],
                  ["合　　　計", totalWithTax.toLocaleString()],
                ].map(([label, val]) => (
                  <tr key={label}>
                    <td
                      colSpan={4}
                      style={{ padding: "4px 8px", textAlign: "right", fontWeight: "bold", letterSpacing: "0.1em" }}
                    >
                      {label}
                    </td>
                    <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: "bold" }}>
                      {val}
                    </td>
                    <td />
                  </tr>
                ))}
              </tfoot>
            </table>

            {/* ⑦ 備考欄 */}
            <div style={{ border, padding: "6px 10px", minHeight: "44px", fontSize: "8.5pt" }}>
              <span>備　考：</span>
              <span style={{ marginLeft: "8px" }}>{quote.notes ?? ""}</span>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
