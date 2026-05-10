import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const MONTHLY_ANALYSIS_LIMIT = 10; // ベータ期間中の月次上限

export const runtime = "nodejs";
export const maxDuration = 120;

type Mode = "materials" | "construction_notes" | "coordination" | "communication";

const VALID_MODES: Mode[] = ["materials", "construction_notes", "coordination", "communication"];

const MATERIALS_TOOL: Anthropic.Tool = {
  name: "extract_materials",
  description: "建設図面から材料・部材一覧を抽出する",
  input_schema: {
    type: "object" as const,
    properties: {
      type: { type: "string", enum: ["materials"] },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            material_name: { type: "string", description: "材料名（サイズ・規格を含む）" },
            quantity: { type: "number", description: "数量" },
            unit: { type: "string", description: "単位（本、m、m²、個など）" },
          },
          required: ["material_name", "quantity", "unit"],
        },
      },
    },
    required: ["type", "items"],
  },
};

const LIST_TOOL: Omit<Anthropic.Tool, "name"> = {
  description: "建設図面から項目リストを抽出する",
  input_schema: {
    type: "object" as const,
    properties: {
      type: { type: "string", enum: ["list"] },
      items: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["type", "items"],
  },
};

function getTool(mode: Mode): Anthropic.Tool {
  if (mode === "materials") return MATERIALS_TOOL;
  const names: Record<Exclude<Mode, "materials">, string> = {
    construction_notes: "extract_construction_notes",
    coordination: "extract_coordination_issues",
    communication: "extract_communication_items",
  };
  return { ...LIST_TOOL, name: names[mode as Exclude<Mode, "materials">] };
}

function buildPrompt(mode: Mode, trade: string): string {
  const tradeContext = `対象業種：${trade}\nこの業種に関係する情報のみを対象とすること。他業種は除外する。\n\n`;

  const bodies: Record<Mode, string> = {
    materials: `この図面PDFを解析して、【${trade}】に必要な材料・部材の一覧を抽出してください。

ルール：
- ${trade} に関係する材料のみ（他業種は除外）
- 数量は数値のみ
- 単位は標準単位（本、m、m²、m³、個、枚、組、式、kg、t など）
- 図面に明示されているもののみ
- 材料名は**現場での通称・略称**を使用すること。JIS規格番号・正式名称は不要
- サイズ・種別は必ず含める（例：管径、圧力区分、材質記号など）
- 塩ビ管の種別は略称で区別すること：VP管／VU管／HI管（耐衝撃）／HT管（耐熱）
- 継手の種別も略称で：TS継手／DV継手／HI-TS継手 など

【材料名の表記例】
- 硬質塩化ビニル管 VP100 → VP管 100A
- 硬質塩化ビニル管 VU200 → VU管 200A
- 耐衝撃性塩化ビニル管 HIVP50 → HI管 50A
- 耐熱性塩化ビニル管 HTVP → HT管 25A
- 配管用炭素鋼鋼管(白) SGP25A → 白ガス管 25A
- 配管用炭素鋼鋼管(黒) SGP40A → 黒ガス管 40A
- TS継手 エルボ VP50 → TS継手 エルボ 50A
- DV継手 チーズ VU100 → DV継手 チーズ 100A`,

    construction_notes: `${tradeContext}この図面PDFを解析して、【${trade}】の施工上の重要な注意事項を抽出してください。
安全管理、品質管理、施工順序、特記仕様など現場の若手作業員が知っておくべき事項を含めてください。`,

    coordination: `${tradeContext}この図面PDFを解析して、【${trade}】と他業者との緩衝・競合が発生しそうな箇所を特定してください。
スペース干渉、施工順序の競合、取り合い部分などを含めてください。各項目は「場所・関係業者・内容」の形式で。`,

    communication: `${tradeContext}この図面PDFを解析して、【${trade}】として他業者への伝達・確認が必要な事項をまとめてください。
先行工事の依頼、納まり調整、機器据付条件、開口補強依頼など。各項目は「宛先業者・内容」の形式で。`,
  };

  return bodies[mode];
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY が設定されていません" },
      { status: 500 },
    );
  }

  // ユーザー認証
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  // 月次解析回数チェック（フィードバックボーナス加算）
  const admin = createAdminClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ count }, { data: userProfile }] = await Promise.all([
    admin
      .from("drawing_analyses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", monthStart.toISOString())
      .is("deleted_at", null),
    admin
      .from("users")
      .select("bonus_analyses, is_unlimited, plan_type")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  // 無制限フラグが立っているアカウントはスキップ
  if (!userProfile?.is_unlimited) {
    const bonusAnalyses = userProfile?.bonus_analyses ?? 0;
    const planType = userProfile?.plan_type ?? "beta";
    const effectiveLimit = MONTHLY_ANALYSIS_LIMIT + bonusAnalyses;

    if ((count ?? 0) >= effectiveLimit) {
      return NextResponse.json(
        {
          error: `解析上限（${effectiveLimit}回）に達しました。フィードバックを送るとクレジットが追加されます。`,
          betaComplete: planType === "beta",
          bonusUsed: bonusAnalyses > 0,
        },
        { status: 429 }
      );
    }
  }

  let base64: string;
  let mode: Mode = "materials";
  let trade = "給排水衛生設備";

  const contentType = req.headers.get("content-type") ?? "";
  const url = new URL(req.url);

  if (contentType.includes("application/octet-stream")) {
    // バイナリ直送（quote-formから直接PDFを送る場合）
    const rawMode = url.searchParams.get("mode") ?? "materials";
    const rawTrade = url.searchParams.get("trade") ?? "給排水衛生設備";
    mode = VALID_MODES.includes(rawMode as Mode) ? (rawMode as Mode) : "materials";
    trade = rawTrade;

    let bytes: ArrayBuffer;
    try {
      bytes = await req.arrayBuffer();
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: `ファイル読み込みエラー: ${detail}` }, { status: 400 });
    }
    if (bytes.byteLength === 0) {
      return NextResponse.json({ error: "PDFファイルが空です" }, { status: 400 });
    }
    if (bytes.byteLength > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "PDFが大きすぎます（上限50MB）" }, { status: 400 });
    }
    base64 = Buffer.from(bytes).toString("base64");

  } else {
    // JSON経由（storagePath）— 図面解析ページ等からの呼び出し
    let body: { storagePath?: string; mode?: string; trade?: string };
    try {
      body = await req.json();
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: `リクエスト解析エラー: ${detail}` }, { status: 400 });
    }

    const { storagePath, mode: rawMode, trade: rawTrade = "給排水衛生設備" } = body;
    mode = (rawMode as Mode) ?? "materials";
    trade = rawTrade;

    if (!storagePath) {
      return NextResponse.json({ error: "ストレージパスが見つかりません" }, { status: 400 });
    }
    if (!VALID_MODES.includes(mode)) {
      return NextResponse.json({ error: "無効なモードです" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: fileData, error: downloadError } = await admin.storage
      .from("drawings")
      .download(storagePath);

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: `ファイル取得失敗: ${downloadError?.message}` },
        { status: 500 },
      );
    }

    const bytes = await fileData.arrayBuffer();
    base64 = Buffer.from(bytes).toString("base64");
  }

  if (!VALID_MODES.includes(mode)) {
    return NextResponse.json({ error: "無効なモードです" }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey });
  const tool = getTool(mode);

  try {
    const message = await anthropic.messages.create({
      model: mode === "materials" ? "claude-opus-4-7" : "claude-sonnet-4-6",
      max_tokens: 8192,
      tools: [tool],
      tool_choice: { type: "tool", name: tool.name },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: base64 },
            },
            { type: "text", text: buildPrompt(mode, trade) },
          ],
        },
      ],
    });

    const toolUse = message.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      console.error("[analyze-drawing] no tool_use block. stop_reason:", message.stop_reason);
      return NextResponse.json({ error: "解析結果を取得できませんでした" }, { status: 500 });
    }

    return NextResponse.json(toolUse.input);
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    console.error("[analyze-drawing] API error:", raw);

    let userMsg = "解析中にエラーが発生しました。しばらく経ってから再度お試しください。";
    try {
      const jsonStart = raw.indexOf("{");
      if (jsonStart !== -1) {
        const parsed = JSON.parse(raw.slice(jsonStart)) as { error?: { type?: string; message?: string } };
        const errType = parsed?.error?.type ?? "";
        const errMsg = parsed?.error?.message ?? "";
        if (errType === "invalid_request_error" && errMsg.toLowerCase().includes("balance")) {
          userMsg = "APIのクレジット残高が不足しています。管理者にお問い合わせください。";
        } else if (errType === "invalid_request_error" && (errMsg.toLowerCase().includes("not valid") || errMsg.toLowerCase().includes("pdf"))) {
          userMsg = "PDFファイルが無効です。別のPDFファイルをお試しください（スキャンPDFや暗号化PDFは解析できない場合があります）。";
        } else if (errType === "invalid_request_error") {
          userMsg = "PDFの解析リクエストが無効です。ファイルを確認して再度お試しください。";
        } else if (errType === "rate_limit_error") {
          userMsg = "リクエストが集中しています。少し待ってから再度お試しください。";
        } else if (errType === "overloaded_error") {
          userMsg = "サーバーが混雑しています。しばらく経ってから再度お試しください。";
        }
      }
    } catch {
      // JSON parse failed — use default message
    }

    return NextResponse.json({ error: userMsg }, { status: 500 });
  }
}
