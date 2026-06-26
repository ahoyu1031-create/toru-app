# TORU 作業ログ

セッション毎の実行記録。新しい作業は **上に追記**（最新が一番上）。

---

## 2026-06-26

### 全6本の語り口を「親しみ・中立トーン」に統一（俺/ぶっきらぼうなタメ口を排除）＋ v3・polish をパイプラインに正式組込 → EP1〜6 一括再生成

**判断（事業パートナー視点）**: 新トーンのEP1試写でユーザーが「めっちゃいい感じ、だが一人称『俺』＋ぶっきらぼうなタメ口が第一印象として"親しみ"でなく"雑/きつい"に振れる」と指摘。チャンネルの顔（＝intro＝第一印象）が最重要との判断に同意。男っぽさを抜き、一人称なし・やわらかい中立トーンへ全話統一を決定。声色(v3)・整音(polish)・配色(ミュート)は承認済みのため固定し、**変えるのは語尾の"雑さ"だけ**の外科的修正に限定。

**実施（既存パイプライン踏襲・ロールバック可のため確認なしで完結）**:
- **声の確定をコードにベイク**: `.env` の `ELEVENLABS_MODEL_ID` を v2→**eleven_v3**（EP1試写はインラインoverrideでv3だったため永続化）。`polish.mjs`（テンポ+6%/ピッチ+9%/無音カット/EQ/ラウドネス）を **run.mjs のTTS直後に正式組込**（生成時1回のみ＝二重がけ防止）。content-factory CLAUDE.md の「v3に上げない」旧指示をv3決定へ更新。
- **全6話×2(intro/body)= 12本の音声台本を書き換え**: 例）`俺も最初は全然わからんかった`→`最初はむずかしく感じますよね。でも大丈夫`、`〜だよね/察してくれない/埋めちゃう/投げてる/だったね/使い倒そう`→`〜なんです/〜てしまう/お願いしがち/でした/使ってみてください`。意味・構成・セグメント対応・テンポは保持。
- TTS誤読対策で `yomi.json` に 鵜呑み→うのみ・条例→じょうれい・裏取り→うらどり を追加（EP5予防）。
- 各話 seconds=0 リセット→ `run.mjs` 一発で TTS(v3)→polish→尺再計測→Remotion(ミュート配色＋改行/括弧修正済みテロップ)→結合 を全6話再生成。

**結果（final.mp4）**: #1 API 41.7s / #2 トークン 30.4s / #3 コンテキスト 34.6s / #4 プロンプト 62.8s / #5 ハルシネ 54.0s / #6 エージェント 63.7s。目視QA：ミュート配色・テロップ括弧複数行・孤立文字/重なり解消・EP6新図解(steps/tools)・全話オーバーフローなしを確認。

**論点（要ユーザー判断）**: #4/#6 が「60秒でわかる」を約3秒オーバー。3プラットフォームとも60秒超は投稿可・視聴者は計測しないため**そのまま投稿を推奨**（ボトルネックは"0本投稿"＝尺3秒より公開速度）。厳密60秒に寄せるなら #4「コツは新人さんに〜」/ #6「ブラウザやファイル、カレンダー」を各1文削れば収まる（要再レンダー）。

**残**: ①漢字の誤読が残れば語を教われば yomi 即追加 ②6/26からEP1→順送りで3面投稿。

---

## 2026-06-24

### EP6「AIエージェントって何？」を新規制作 → 全6本に拡張・3プラットフォーム1日1本運用へ

**判断（事業パートナー視点）**: 6/24から X / TikTok / YouTube の3面で1日1本ペース投稿を開始するにあたり、在庫を1本積み増し。題材は **AIエージェント** を選択。理由＝①2026年最大のAIトレンドで「聞いたことはあるが説明できない」層が最も厚い＝保存されやすい ②EP5「AIは答えを知らず鵜呑み危険」から「その"答えるだけ"のAIが自分で動く時代へ」と地続き ③EP7=MCP（道具箱）への布石。6/18編成メモ「MCPは専門寄り→エージェント回とセットで後ろへ」に沿い、エージェントを#6に前倒し・MCPを#7へ。

**実施（確認なしで完結＝既存パイプライン踏襲・ロールバック可）**:
- 新ジョブ `output/2026-06-24-ai-agent/`（script.md / voice-intro.txt / voice-body.txt / body-props.json）を既存EP5と同一構造で作成。7セグメント・実写なし introカード（hook）。
- **新図解2個（1エピソード上限内）を `Kaisetsu.tsx` に追加**: `steps`（ゴール札を渡すと手順に自動でチェックが付く＝自走の可視化）/ `tools`（🤖が🔍ブラウザ・📄ファイル・📅予定を自分で使う＝MCP回への布石）。残りは summary×3 / points / cta を再利用。
- TTS誤読対策で `yomi.json` に 競合→きょうごう・相棒→あいぼう・禁物→きんもつ を追加。
- `node pipeline/run.mjs output/2026-06-24-ai-agent` 一発で TTS→尺自動割当て(build-props)→Remotion描画→BGM結合→ギャラリー更新まで完走。**final.mp4 61.5秒**。
- **目視QA**: intro／全新図解（steps/tools）／points／cta／summary の6フレーム抽出 → EP1〜5と同一トンマナ（白背景・kickerピル#6・下部センター大型キャラ・中央テロップ）で破綻なしを確認。

**結果**: シリーズ全6本が投稿可能状態に。投稿プラン（CLAUDE.md）に EP6 投稿文＋引用RP導線を追記、series設計書の#6を✅・#7をMCPに更新。

**残（投稿フェーズ）**: ①6/24からEP1→順送りで3面投稿（X主戦場／TikTok・YouTubeは二次利用）②2本目以降は前話を引用RP ③数字を `articles/log.md` に記録 ④6本走り切ったらEP7(MCP)の要否・本人実写回の投資判断。

---

## 2026-06-22

### 動画トラックを「閉じる」: EP1〜EP5を全話v2・顔出しなしに統一 → 投稿待ち状態へ

**判断**: 動画とアプリの並走（＝「逃げ」）をやめ、まず動画を納得いくまで仕上げて一旦クローズ→以降は TORU 営業に集中、とユーザーが決定（「どっちもどっち中途半端が一番嫌」）。診断で「**作った動画5本／投稿0本**・EP4のみ未完成（カスタムアバター待ちでpreviewのみ）・EP1〜3とEP4/5でデザイン世代が割れ・**EP2にhedraウォーターマーク**」が判明。分岐相談で「**顔出しナシで今すぐ出す**」を選択。

**実施（全て課金ゼロ＝既存intro音声を再利用・HeyGen不使用・ロールバック可能なので確認なしで実行）**:
- **EP4（プロンプト編）を確定**: body-props に `hook` 追加→run.mjs が自動で HeyGen スキップ＆Remotion 内 intro カード描画。charHeight 820→660。古い HeyGen `intro.mp4` は `_intro-heygen-old.mp4` へ退避（assemble の二重 intro 防止）。v2 再レンダー→**final.mp4 59.8秒**
- **EP1〜EP3 を v2・顔出しなしに作り直し**: 旧v1（方眼背景・SECカウンター・キャラ不在・テロップ左下、EP2はウォーターマーク）を現行コンポジションで再レンダー。各 props に `label`/`hook`/`hookSeconds`/`voiceIntroFile`/`charHeight:660` を追加、**全セグメントにキャラ pose 付与**、SE統一（pop/swoosh/ding）。古い intro.mp4 退避。
  - EP1 API **37.4s** / EP2 トークン **35.3s（ウォーターマーク消滅）** / EP3 コンテキスト **52.0s**
- **検証**: 全5本の intro＋本編フレームを目視 → 同一トンマナ（白背景・kickerピル #1〜#5・下部センター大型キャラ・中央テロップ・顔出しなしintroカード）で統一を確認

**結果**: EP1〜EP5 が「別人が作った3+2」状態から**一貫した1シリーズ**に。HeyGen依存ゼロ・ウォーターマークゼロ・本人手番待ちゼロで**投稿可能状態**。

**残（投稿フェーズ）**: ①投稿コピー確定（script.md に各話下書きあり→post.md 集約）②投稿順・頻度（EP1→EP5の連投 or 隔日）③サムネ要否（introカードがカバー兼用で代替可）④ユーザーのX/YouTube投稿実行。**content-factory 側の変更は未コミット**（GitHub push 未）。

**次フェーズ予告**: 動画クローズ後は TORU 本体＝**営業フェーズ**（ほぼMVP完成・約3週間ノータッチのアルファ/β棚卸しから）。ユーザーと相談しながら進める。

---

## 2026-06-19

### EP5ビジュアルv2（FB全反映）＋キャラPNG実寸化＋動画フローのワンクリック化 ＋ E:→C: 完全移設

**EP5「なぜAIは嘘をつく？」v2リデザイン（2枚目FB全反映）**
- 旧版はキャラが小さく右下/中央でバラけ・グリッド背景・色多い・SEC表示・余白過多
- → 白背景／キャラを**下部センターに大型固定（全セグメント・ポーズのみ切替）**／説明文は中央のキャラ上に白カード／色をネイビー＋オレンジ中心に整理／**SECカウンター削除**／余白圧縮
- fabricate: 「✕存在しない」スタンプを捏造行(型番)へ正確に添える。points: 3項目を1行固定。commit `0cf4afd`

**キャラPNGの根本改善（実寸化）**
- 原因特定: PNG(800x1280)の人物は画像高の約54%で上下に透明余白＝charHeight640でも画面1/5に見えていた
- `pipeline/06-character/trim.py` 新設: アルファ境界で**全ポーズ共通枠クロップ＋影カット** → 789x653（人物が枠いっぱい＝charHeightが視認サイズに直結）。原本は `poses-raw/` に保存
- intro=画面半分強（height1080）、本編=約1/3（charHeight660）に最適化

**動画フローのワンクリック化（build-props）**
- これまで手作業だった「TTS→silencedetect→手で各セグメントに秒配分」を自動化
- `pipeline/build-props.mjs` 新設: voice-bodyの無音点へスナップしてseconds自動割当て（重み=segment.narration）。hookSecondsもvoice-intro実尺から自動
- `run.mjs` に統合: seconds未設定なら自動で尺決め → **`node run.mjs output/<slug>` 実質一発**。commit `44920fd`（GitHub push済み）

**⚠ E:外付けSSDが再度落ちた → C:内蔵NVMeへ完全移設**
- 作業中にE:が**物理ディスクごとバスから消失**（昨日のexFAT Dirtyより重症）。配線接触が不安定との由
- 復旧手順: ①再スキャンで復帰（Dirtyのまま）②**先にバックアップ**（読み取りは可）→ chkdsk等の修復は後回し（安全側）
- バックアップ: 秘密情報(.env6種)→`C:\AI-project-backup\_secrets_*`、全体ミラー1,015MB/2,330ファイル**失敗0**→`C:\AI-project-backup\AI project`、両リポGitHub push（TORUに未push5commitあり→解消）。再実行用 `C:\AI-project-backup\backup.ps1` 作成
- **移設**: `C:\AI project` を新・本番作業ツリー化（.env移管・node_modules3つ再インストール・Claudeメモリを`C--AI-project-TORU`へ移管）。C:でEP5レンダー＋build-props動作を検証OK（E:と完全一致）
- **今後: Claude Code は `C:\AI project\TORU` で開く。E:はコールド予備＝USB依存を解消**

**残**: ①TORU本体の振り返り（約3週間ノータッチ・アルファ/β状況の棚卸し）②本人実写回はHeyGen Digital Twin（2〜5分自撮り）作成→AVATAR_ID

---

## 2026-06-18

### HeyGen実写の正体調査 ＋ 外付けSSD障害復旧 ＋ EP5「なぜAIは嘘をつく？」を実写なしで完成

**HeyGenジェスチャー＆プラン調査（ユーザー質問への回答）**
- 「五味さん級の手が動く実写」の作り方を最新仕様で確認: 写真ベース(talking_photo/今のintro)は顔と口だけ＝手は不可。本人の手の動きを出せるのは**動画から作る Digital Twin（Video Avatar）のみ**（2〜5分1テイク・最初30s neutral→2秒ごとにジェスチャー→ニュートラル復帰で学習）
- プラン: 無料は不可。Avatar IV(写真→AIの汎用ジェスチャー)はCreator$29〜、本人の手の動き(Digital Twin)はCreator$29 or Business$149で情報が割れる→**実機UIの課金プロンプトで要確認**。Gesture Control(手動調整)は通常プラン全ティアで✗だった（前回オーバーに説明したので訂正）
- **HeyGen API残量 = 284クレジット**（+Avatar IV無料3）。実写回まで温存
- 戦略提案: $149は今すぐ出さず「実写なし回を主力（課金ゼロ）＋ここぞは Creator$29+Avatar IV で安く検証」の2トラック

**外付けSSD障害と復旧（セッション中に発生）**
- 作業中に E: ドライブが消失（File does not exist）。原因＝**USB外付け `BUFFALO SSD-PHPA/N`（exFAT）がバスから切断→再接続、exFATがDirty(破損フラグ)**化
- ユーザーが chkdsk で修復→ NOT Dirty に回復。以降は書き込み再開。※事業の柱がバックアップ無し外付け1台は単一障害点＝要バックアップ設計

**EP5「なぜAIは嘘をつく？」（ハルシネーション・シリーズ#5・実写なし）**
- 編成判断: 設計書#5=MCP予定を、保存率の高い普遍ペイン＝ハルシネーションに前倒し（前回プロンプト→「完璧に指示しても嘘をつくのはなぜ」と地続き）。MCPはエージェント回と束ねて後ろへ
- メタファー: AIは答えを知らず「次に来る言葉を確率で選ぶだけ」だから、知らない事もそれっぽく埋める（配管の実例＝ありもしない型番/条例）
- **3枚目FBを共通コンポジションに反映（恒久化）**:
  - 旧 CharacterPose（各セグメントで右からスライドイン＝「点々」の原因）→ **PersistentCharacter**（下から一度せり上げ→右下に固定・ポーズのみ切替）
  - charHeight 820→**640（画面高の約1/3）** を本編標準に
  - **2枚目FB＝実写なしintroカード**を新設（大タイトル＋大キャラ pose-04、HeyGen不要でRemotion内完結）
- 新図解2種（上限内）: `predict`（蛇口の水が→候補を確率%で選ぶ）/ `fabricate`（仕様書＋赤スタンプ「存在しない」）。VisualPoints中央寄せ・SegCounter左下へ
- **一発フロー改善＋既存バグ修正**: run.mjs に「hookありなら実写なし→HeyGenスキップ」「音声をpublicへ自動コピー」を追加。`--props` のパス空白（E:\AI project）でレンダーが壊れる既存バグをクォートで修正（全レンダー影響）
- 制作: ElevenLabs(intro5.9s/body40.4s・235字)→silencedetectで7セグメント尺を実測→`node run.mjs` 一発で TTS skip→public複製→HeyGen skip→Remotionレンダー→BGM結合まで自動 → **final.mp4 完成（48.7秒）**
- 全7シーン目視検証OK（intro/本編固定キャラ/predict/fabricate/points/cta）。commit `f89386a` → push
- **完成: `output/2026-06-18-hallucination/final.mp4`（実写なし・約49秒）**。投稿文は script.md に用意済み
- 残: ①ユーザー確認（テンポ・キャラ位置/サイズ・尺49秒の是非）②本人回をやるなら Digital Twin の課金ライン実機確認＋カスタムアバター作成

---

## 2026-06-16

### SE「ding」刷新 → SE3種確定 ＋ EP4(プロンプト編)を本番完成（実写intro＋大型キャラ）

**SE仕上げ（前回ユーザーフィードバック「dingが耳障り・キーン音」の対応）**
- ding候補4種を合成して聴き比べ → ユーザーが **A（マリンバ2音上昇 C5→G5）** を選択
- `pipeline/synth-audio.mjs` の `makeDing` を旧E6ベル（高域キーン）→ BGMと同じマリンバ音色に差し替え（lowpass=f=4000で刺さり除去）。pop/swooshは承認済みで据え置き
- `.gitignore`: 小さい固定素材 `public/se/*.mp3` を除外解除しGit管理化（クローンで即描画可）。一時候補スクリプトは破棄。commit `1b43c43` → push

**EP4「プロンプトって何？」（シリーズ#4・API→トークン→コンテキスト→プロンプトの連鎖）**
- メタファー＝**プロンプトは職人への「指示書」**。ざっくり指示→ズレ / 具体指示→狙い通り（配管屋の現場感で差別化）
- 新図解 `prompt` を1個だけ追加（mode vague/clear・指示書ビフォーアフター。clear版は蛇口交換の具体例で「誰に何をどう」を実演）。残りはoverflow/summary/ctaを再利用＝「新部品2個まで」ルール内。commit `50c56bd` → push
- **SE/ポーズをセグメント別に配置**（ユーザー主目的）: 切替pop / clear時swoosh / CTAでding、ポーズは復習pose-03・定義pose-01・失敗pose-06・成功pose-07・コツpose-08・CTA pose-05（中央ブックマークを指す）
- 課金規律遵守: まず課金ゼロでサイレント下書き→全6セグメント目視→ユーザー承認(「ヘイゲン/イレブンラボOK」)後に本番制作
- **ユーザーFB反映**: ①SE/BGMがデカい→SE 0.5→0.28・BGM 0.12→0.07に減衰 ②キャラをもっと大きく(五味さん風)→pose 400→620px(画面高32%)・右下で存在感
- 本番制作: ElevenLabs(本編19.6s/intro8.2s・model v2)→無音検出で各セグメント尺を実測調整→Remotion本番レンダー→**HeyGen実写アバター(talking_photo)でintro生成**→assembleでintro+body+BGM結合
- 末尾バグ修正: Root.tsxの合成尺+2秒尾が無地画面を生んでいた→0にしてCTAを最後まで保持
- 30秒版完成後、ユーザーFB3点で改修:
  - **「五味さん」＝ハヤカワ五味氏**（このcontent-factoryの手本。約1分動画・冒頭実写＋後半Remotion・ブックマーク249の保存特化）と判明。memo化済み
  - **尺**: 「60秒でわかる」ブランドに対し本編30秒は短い→**約60秒に拡張**（9セグメント。3点フレームワーク＋配管見積りの具体例で保存価値↑）。本編音声50.2s→silencedetectで全境界に尺一致
  - **キャラ拡大**: 比較静止画(620/820/1000px)で検証→**820px(画面高43%＝半分弱で存在感)** をデフォルト化。charHeightをprops化
  - **HeyGen手の動き**: 現状talking_photo(ストック)では手が動かせない→ユーザーが**自分のカスタムアバター**(2分自撮り→HeyGen)を作成し本人の見た目＋ジェスチャに差し替える方針
  - 新図解: `points`(3点チェックリスト・左寄せでキャラ非干渉)、`prompt`をitems対応(任意の指示文)。commit `5c988f8`
- **プレビュー完成: `output/2026-06-16-prompt-toha/final-preview-oldintro.mp4`（59.6秒・旧introのまま）**
- 残: ①ユーザーがHeyGenカスタムアバター作成→AVATAR_ID差し替え→intro再生成→再assemble ②音量・サイズの最終チェック → OKで投稿

---

## 2026-06-15

### キャラシート8種 完成（ポーズ2〜8をGemini画像APIで一括生成）

- ユーザーがGemini APIのCloud Billingを有効化 → 画像API(gemini-2.5-flash-image)が解放（6/13は無料枠=0で429だった）
- `pipeline/06-character/generate.mjs` を刷新: v1.1呪文＋ポーズ番号指定＋**マスターpose-01添付**で絵柄固定。`node ... 2 3 4 5 6 7 8` で一括生成
- **文字混入バグ発見・修正**: ポーズ説明の引用符つきオノマトペ(`「えっ？」`)をモデルが画像に "Ehh?" として描画 → 引用符除去＋文字禁止を最大強度化。character-prompt.md にも学びを反映
- pose-05は「腕を横に伸ばす指差し」に刷り直し（基本形pose-01との差別化。右下配置で中央図解を指す形）
- 全8ポーズを colorkey透過 → `pipeline/04-video/public/char/pose-01〜08.png` に配置
- モデル選定: コスパ最優先の指示だが **pose-01マスターとの絵柄一貫性**を優先し flash-image を継続（モデル変更は画風が割れるため）
- コスト実績: 1枚~$0.04 × 約9生成 ≈ ¥60程度。commit `ee5e794` → GitHub push済み
- 残: ①EP4(プロンプト編)制作 ②BGM/SE素材の配置（assets/audio/ が空＝ユーザーがDOVA/効果音ラボから配置待ち）

---

## 2026-06-13

### 🎉 HeyGen API全自動化に成功 — EP3完全版（53.7秒）/ ローカル移行計画策定

**同日追記 — バックアップ完了＋BGM/SE実装**:
- content-factory を GitHub private リポジトリへ push（朝のEドライブ事故対策完了）
- BGM自動ミックスを assemble.mjs に実装（ループ・音量12%・末尾フェード・loudnorm。仮音源で配線テスト済→クリーン版に復元）
- セグメント切替効果音を Kaisetsu に実装（seFile prop・2セグメント目以降に再生）
- 音素材は assets/audio/README.md の規約どおりユーザーがDOVA/効果音ラボから配置すれば自動適用
- .env に GEMINI_API_KEY 枠追加（キャラ画像生成: 設計=Claude/生成=nanobanana。キー待ち）
- ユーザーFB: introの実写の話し方「めちゃくちゃいい」。本編のテンポ改善は読点ルール改訂済みで次回反映

**同日追記 — キャラクター確定・動画組込み完了**:
- Geminiキー検証→画像APIは無料枠ゼロと判明→AI Studio手動ルートで生成
- トンマナ呪文v1→v1.1（ユーザーFB「可愛すぎ・目が女性的」→切れ長の目・太眉・頭身アップ）→ **キャラ決定**
- pose-01をマスター登録（assets/character=原本、public/char=colorkey透過版）
- Kaisetsuに Segment.pose 対応実装（右下にスッと出てゆれるリアクション）。mix-blend-mode不発→ffmpeg colorkeyで解決。静止画検証OK
- 残: ポーズ2〜8生成（ユーザー・AI Studio）/ BGM・SE素材 / EP4フル仕様制作

- 朝にEドライブ切断事故（外付け）→ 復帰確認。TORUはGitHub済みで無事、**content-factoryはリモート無し→バックアップ要**（ユーザーがgithub.comで空のprivateリポジトリ作成→push予定）
- HeyGen: ユーザーがアバター4種生成、お気に入り「Podcast host in black sweater」に決定
- `.env`のAVATAR_IDが誤り（一覧に不在）→ 無料のlist APIで検証する手順を確立し、正しいIDに修正
- **発見: 生成系アバターは `talking_photo` 種別** → heygen.mjs に種別自動判定を実装
- **実弾テスト成功**: 種別判定→音声アップ→生成→ポーリング→DL→結合まで全自動。**EP3「AIが急に忘れる理由」完全版53.7秒・ウォーターマーク無し**（API有料生成のため）
- intro原価: 約9秒で数十円。「ネタ一言→実写intro付き完成動画」が**完全自動化された**
- ローカル移行計画を `docs/local-migration-plan.md` に保存（8GB VRAM実測前提・移行トリガー=HeyGen月3,000円超）
- キャラクター化の役割分担確定: **設計（トンマナ・プロンプト）=Claude / 生成=nanobanana（Gemini画像API）**。Geminiキー取得後に着手

**残り**: ①content-factoryのGitHubバックアップ（ユーザー: リポジトリ作成30秒→私がpush）②EP1/EP2の音声を話し言葉ルールで再生成して投稿準備 ③サムネ→初投稿。

---

## 2026-06-12

### v1.1 修正 + ジョブ2号「トークンって何？」を台本から一貫制作（ワークフロー検証完了）

- ユーザー指摘の修正: example図解の重なり（絶対配置で再レイアウト）/ 矢印ラベルにピル背景
- **ElevenLabs v3 が Starter で使えると実証**（プラン制限なし）。v2の「噛み」対策として v3 採用
- 顔写真受領（assets/face/）→ **顔バブル**として組込み（左下円形・ゆれアニメ。リップシンクは外部サービス契約後）
- 図解の部品化前進: summary をデータ駆動化（visualData）、新図解 tokenize / coins 追加（計10種）
- **ジョブ2号 `2026-06-12-token-toha`（29.3秒）: 台本→v3音声→図解→顔→結合まで一気通貫で完成**
  → 「ネタ指定だけで1本出てくる」ワークフローが実証された

**同日追記 — 🎉 ゴミさん式・完全形が完成**:
- 顔バブルは不要とのFB → 撤去（コンポーネントは温存、propsでoff）
- ユーザーがHedra（無料枠）で `intro.mp4` 生成（7.8秒・本人リップシンク・身振りあり）→ assemble.mjs で自動結合
- **`2026-06-12-token-toha/final.mp4`（37.1秒）= 実写風intro → 図解本編 の完全構造**。フレーム確認OK
- 課題: Hedra無料枠のウォーターマーク（右下）。除去は有料プラン
- Hedra vs HeyGen は「一貫性 vs 手軽さ」のA/B判断へ（HeyGen無料トライアルで同条件比較→勝者に課金）

**同日追記 — シリーズ化＋EP3＋HeyGen運用＋X記事第1号**:
- HeyGen採用を確定（Hedraは無料A/B用）。`pipeline/03-avatar/README.md` をHeyGen運用手順書に全面改訂
  （アバター作成のコツ・consent動画・毎回5分の手動フロー・API化要件=$99/月は月50本トリガー）
- **シリーズ「60秒でわかる」設計書**（`series/60byou-cs.md`）: EP1 API→EP2トークン→EP3コンテキスト→EP4プロンプト…の連鎖設計＋引用RP投稿戦略
- **EP3「AIが急に忘れる理由」本編完成**（44.8s音声・新図解 overflow=机からあふれる/forget=霧散、計12部品）。introはHeyGenアバター作成後
- **X記事第1号ドラフト**（`articles/drafts/2026-06-12-token-ryokin.md`）: トークン料金の深掘り。TORU開発のモデル振り分け実体験を心臓に。[要確認]2箇所＝実数字待ち
- `articles/log.md`（投稿実測データの記録台帳）作成 → プレイブックを実証で育てる仕組み

**残り（ユーザー）**: ①HeyGenアバター作成（2分自撮り+consent）②EP3のintro生成 ③記事の[要確認]数字 ④Premium+確認。

---

## 2026-06-11

### Content Factory v0.1 構築（別リポジトリ `E:\AI project\content-factory`）

**背景**: Fable 5期限(6/22)までに「ネタ→動画/記事/サムネ」の量産ワークフローを構築する方針（ハヤカワ五味氏のワークフロー分析が起点。詳細は `TORU/docs/content-factory-plan.md`）。

**実施**:
- 元ポストをPlaywrightで実物確認 → 「撮影ゼロ・完全生成」と判明（冒頭実写風パートもAI生成）。1:23動画で再生3.3万・保存249
- X記事の実例（ノア氏・92.7万インプ）を分解 → `articles/article-playbook.md`（行動心理・文法・サムネ原則）
- Xアルゴリズム調査（滞在時間/ブックマーク/縦型動画優遇）→ プレイブックに反映
- **content-factory リポジトリ作成（23ファイル・2コミット）**:
  - pipeline/00-formats.md — 全ジャンル対応のプリセット設計（生成系kaisetsu/list/news/story + 素材加工系game/tutorial、cuts.jsonでカット編集表現）
  - 01-script（台本テンプレ）/ 02-voice（ElevenLabs tts.mjs・依存ゼロ）/ 03-avatar（HeyGen/Hedraアダプタ方針）/ 04-video（Remotion雛形・Kaisetsuコンポジション）/ 05-assemble（ffmpeg結合）/ run.mjs（不足要素を可視化するオーケストレーター）
  - banners/ — HTML→PNG方式。**記事ヘッダー(1200x675)と動画カバー(1080x1920)の実機デモ撮影成功**（output/demo/）。縦型カバーの背景CSSバグ修正済み
  - config/style-profile.md（文体プロファイル・未充填）/ brand.md（Blueprint色流用）/ topics/neta.md（ネタ帳初期20本）

**同日追記（夜）**:
- `.env` 実体化（キー貼るだけ）・`assets/`（voice/face/posts、Git管理外）作成
- **ユーザーは ElevenLabs の既存クローン保有と判明** → 録音不要、Voice IDを貼るだけに短縮
- ジョブ1号 `output/2026-06-11-api-toha`（APIって何？）: 台本・音声テキスト・body-props.json 作成
- Remotion `npm i` 完了 → コンポジション登録確認 → **body.mp4（42秒・無音版v0.1）実レンダリング成功**・フレーム目視OK
- ハーネス再構築の方針合意: ワークフロー完成→スキル化→ハーネス再構築の順（CLAUDE.mdダイエット/全スキル化/フック自動化/権限最適化）

**同日追記（深夜）— 🎉 1本目完成（クローン音声入り）**:
- ElevenLabs: Freeプランで `subscription_required` 確認 → ユーザーがStarter($5)に変更 → **TTS成功**（intro 6.6s / body 30.3s）
- 音声実尺に合わせてセグメント再配分（8セグメント・計30.5s）→ Remotion再レンダー → ffmpeg結合
- **`output/2026-06-11-api-toha/final.mp4`（32.6秒・AAC音声入り）完成**。撮影ゼロ・指示のみで1本通った
- スキル2号 `x-article-writer` 稼働（動画と記事の領域分離。1スキル=1領域の原則を確立）
- ハーネス方針: スキル層整備が今回分。CLAUDE.mdダイエット/フック/権限はワークフロー安定後

**同日追記 — Kaisetsu v1.0（デザイン本実装）完了**:
- 声の品質: ユーザー確認「めっちゃいい感じ」→ 現行Instant Cloneで続行決定
- remotion-best-practices スキル読込み → Kaisetsu 全面書き直し:
  visual図解8種（注文窓口/矢印往復/ブラックボックス/アプリ間通信/API連鎖/積み木/まとめ/保存CTA）、
  プログレスバー、SECカウンター（製図ラベル風）、入退場アニメ、Blueprint配色統一
- 再レンダー→結合→**final.mp4 v1.0 完成**。フレーム4点目視OK
- 検証で確立した「フレーム抜き目視」手順は次回スキルに反映する



---

## 2026-06-10

### フロー一貫性監査 + /alpha 行き止まりリンク全廃 + 解析バックエンド健全性確認

**背景**: ユーザー依頼「今やるべきこと・直すべきところ・一貫したフローができているか確認。昨日エラーが出たのが気になる」。

**昨日(6/9)のセッション再構成**（未コミットで残っていた作業）:
- 20:56 `analyze-client.tsx` のトライアル切れCTA `/alpha`→`ALPHA_FORM_URL` 修正（未コミット）
- 21:04 `scripts/db/recent-signups.mjs` 新規（登録者一覧スクリプト）
- 22:09 `scratch/sample-drawing.html` から自作サンプル図面 `web/public/samples/sample.pdf` を生成（**「サンプル図面で試す」ボタンは未接続**。コード上どこからも参照なし）
- `.gitignore` に `scratch/` 追加

**エラー原因調査**:
- DB直接確認: `drawing_analyses` の最新レコードは **5/16**（6月の解析レコード0件。失敗時は行が作られない仕様）
- **本番同条件で sample.pdf を解析APIに直接投げて検証 → ✅成功**（Opus 4.7・13品目抽出・APIキー/クレジット/モデルID/PDF全て正常）
- モデルID `claude-opus-4-7` / `claude-sonnet-4-6` は有効と確認（claude-apiスキルで照合）
- → **バックエンドは健全**。昨日のエラーの実体はUI側の何か（要ユーザー確認）の可能性大

**フロー監査の発見と修正**（5/29の `/alpha`廃止→`/`リダイレクト化 の残骸が3箇所残っていた）:
1. `settings/plan/page.tsx:146` トライアル切れ文言内「アルファテスター枠に申込」が `/alpha`（→LPに飛ばされ迷子）→ `ALPHA_FORM_URL` 外部リンク化 ✅
2. `settings/plan/page.tsx:195` アンバーカード「もう一つの選択肢」も同様 → 外部リンク化 ✅
3. `app/page.tsx:437` LPフッターの ALPHA リンク（`/`への自己ループ）→ 削除（5/29方針「アルファ入口はアプリ内に集約」に整合）✅
- 検証: `tsc --noEmit` ✅ / `npm run build` ✅ exit 0
- 本番LP稼働確認 ✅（Playwright）

**残課題（このセッションで未対応）**:
- 「サンプル図面で試す」ボタンの実装（sample.pdf は配信されるだけ。analyze画面への接続が次タスク）
- `recent-signups.mjs` の不具合: users テーブルのフラグ取得が失敗しても無言で全員「一般」表示になる（error握りつぶし）。aoki.ai が team_unlimited なのに「一般」と出たのはこれ
- 認証画面バッジの出し分け（既知・本番前チェックリスト記載済み）

---

## 2026-06-03

### X コールドDM 開始 + 「DM君」テンプレ集を新規作成

**背景**: 固定ツイ公開（紹介動画は120fps→Xに弾かれ→ffmpegで60fps化、168MB→30MBに変換して解決）。今日から X で社長・経営者クラスに DM を開始する方針。

**作成**: `docs/dm-templates.md`（DM君）— コピペ用コールドDMテンプレ集
- A. 社長・経営者向け（今日のメイン。ROI/人件費/受注スピードで語る。2ステップ＋簡潔ワンショット）
- B. 実務者向け（積算/一人親方・2ステップ）/ C. AI×建設発信者向け / D. ワンショット（痛み投稿者向け）
- 鉄則: 事前にいいね/リプで認知→冒頭1行を個別化→URLは2通目→1日2〜3通→「教えてください」トーン→記録つける
- トラッキング表・禁止事項つき

**メッセージ統一**: 価値訴求は「**半日〜1日 → 10分**」で固定ツイ/LP/DM 全部揃えた（旧docsの「1日→30秒」は抽出単体の話）。

**関連既存docs**: bio/固ツイ案=`x-strategy-drafts.md`、アルファ承認=`alpha-tester-runbook.md`。

### プラン画面: ベータ中は決済UIを無効化 + developer の team_unlimited 表示を解消

**背景**: 個人営業を本格化するにあたり、(1) ベータ期間中はユーザーが実際にプラン変更（課金）できないようにしたい。ただし裏のStripeシステムは丸ごと維持し、正式公開時に即解放できる状態に。(2) developer アカウント（is_unlimited）が比較表で「team_unlimited が現在のプラン」と表示されるのが実態と違うので、プランなし扱いに。

**実施**（`web/app/(app)/settings/plan/page.tsx` の表示ロジックのみ。Stripeバックエンドは不触）:
- ① 比較表の `isCurrent` を `!hasUnlimitedAccess && planType === plan` に変更 → developer/alpha はどのカードも「現在のプラン」にしない（team_unlimited ピン留め＆developerバッジ廃止）。上部「現在のプラン: developer（無制限）」はそのまま（正確なので維持）。
- ② プラン変更ボタンを `IS_LIVE_BILLING` でゲート。ベータ（test）中は無効化した「ベータ期間中」ボタンを表示、`UpgradeButton`（→PlanChangeModal→Stripe Checkout）は live 時のみ描画。**`NEXT_PUBLIC_BILLING_MODE=live` を立てれば即解放**。
- ③ フッター文言もベータ中は「プラン変更は停止しています（正式公開時に解放）」に。
- 検証: tsc/build エラー0。
- 補足: developer の DB プラン（北陸電工=team_unlimited）は未変更。is_unlimited=true が無制限アクセスを付与しており plan 値は表示・機能に影響しないため。必要なら別途 null 化可能。

### 確認事項メモ + 本番前チェックリスト作成

- **β参加者の「現在のプラン」表示**: "β" にはならない。普通のサインアップ=「無料体験中」（10回/7日トライアル, 緑）、アルファ承認=「アルファテスター」（無制限, オレンジ）。betaはプランでなく期間。DM経由の人を無制限にしたいなら alpha 承認運用。
- **カリさん(aoki1031movie)** が team_unlimited 表示なのは、過去のStripeテスト購入の課金データが残っているため（正しい挙動）。青木優(dev)は今回の修正でプランなし表示に。
- **認証画面の信頼バッジ問題（既知バグ・本番前対応）**: `auth-shell.tsx` の3バッジ（クレカ不要/登録1分/ベータ無料）が signup/login 共通パネルに出ており、**login画面でも「登録は約1分で完了」が出てちぐはぐ**。本番前に出し分け or login非表示。
- **`docs/pre-launch-checklist.md` 新規作成**: 本番(Live)切替前にまとめてやる項目を集約（BILLING_MODE切替/Stripe Live化/コピー見直し/テストアカウント整理/動画・固ツイ正式版 等）。気づいたら随時追記する運用。

### パフォーマンス改良 #1: ナビのクリック即フィードバック

**背景**: ユーザー指摘「TORUがもっさり＝ページ遷移＋操作の反応」（AI処理は後回し）。調査の結果、`loading.tsx` は18ファイルで全ルートほぼ網羅済み（スケルトンは充足）。真因は**クリック直後のフィードバックが無い**こと（サイドバー押下→遷移完了までアクティブ表示も動かず無反応に見える）。

**実施**: `web/components/app-sidebar.tsx` に Next 16 の `useLinkStatus` を使った `NavSpinner` を追加。親ナビ項目をクリックすると、その項目に**即スピナー**が出る（遷移中だけ）。サイドバー内のみの追加で低リスク。tsc/build エラー0。

**次の候補（順次）**: サブ項目にも同様、重いページ（dashboard等）のクエリ最適化、AI処理（図面解析）の体感改善は最後。`(app)/layout.tsx` は共有レイアウトで遷移ごとに再実行されない（既にOK）。

---

## 2026-05-29

### LP一本化 + auth画面（signup/login/onboarding）を Blueprint デザインに刷新

**背景**: LPはBlueprint化済みだが、`/signup` 以降のアカウント登録〜アプリ内が旧"Dark Pro"デザイン（青#2563EB/オレンジ/ダーク紺）のままで、LP→登録で世界観が分断していた。ユーザー指摘「サインアップもサービスもLPとモードが違う、LPに合わせていく」。

**方針合意**:
- LPは `/` 一本化（`/alpha` は廃止）。アルファ応募の入口は公開LPではなく**アプリ内のトライアル壁**に集約。承認は owner の DB操作（変更なし）。
- デザイン統一は ①auth フルBlueprint → ②globals.css の色トークン差し替えでアプリ内全体を寄せる、の2段階。作業画面に方眼等の重い装飾は入れず可読性優先。

**このセッションの実施（①auth まで）**:
1. **LP一本化**: `app/alpha/page.tsx` を `redirect("/")` に置換（600行→7行）。既存 `/alpha` リンクは `/` に転送。
2. **トライアル壁バナー直リンク化**: `components/trial-banner.tsx` の test mode ended CTA を `/alpha` → `ALPHA_FORM_URL`（新タブ・`<a target=_blank>`）。`/alpha`消去で行き止まりになる動線を修正（=一本化と1セットの必須変更）。
3. **Blueprint フォーム部品**: `globals.css` に `.bp-label .bp-input .bp-alert(.bp-alert-ok) .bp-code` 追加（紺枠・focusでオレンジシャドウ）。
4. **共通シェル**: `components/auth-shell.tsx` 新規。左=製図モチーフのブランドパネル（TORUロゴ・「図面を投げたら見積書が出てくる」・安心材料3点）＋右=フォーム枠。signup/login で共有。
5. **3画面刷新**: `signup/page.tsx` `login/page.tsx`（AuthShell使用）、`onboarding/page.tsx` + `onboarding-form.tsx`（bp-grid + bp-input/label/cta）。

**検証**:
- `npx tsc --noEmit` ✅ エラー0
- `npm run build` ✅ exit 0
- ブラウザ確認: `/signup`（1440/モバイル）・`/login` がBlueprintで描画、コンソールエラー0。`/alpha`→`/` リダイレクト確認。
- ⚠️ `/onboarding` は認証必須のため未ログインで視覚確認不可（ビルド通過・signup/loginと同部品なので問題なし想定。実機ログイン時に最終確認）。

**①コミット**: `9995dad` で push 済み（Vercel 自動デプロイ）。9 files, +375/-1011（/alpha 巨大ファイル削減）。

### ②アプリ内全体を Blueprint トークンに統一（同セッションで実施）

**調査**: アプリ内は `var(--color-*)` トークンを **348箇所/37ファイル**使用、ハードコード青/オレンジは少数 → トークン差し替えで大部分が連動する低リスク構造と判明。

**実施**:
1. `globals.css` `:root` を v0.3 Blueprint に差し替え:
   - `--color-primary` #2563EB→**#0B3D91**(紺) / `--color-accent` #F97316→**#FF6B35** / `--color-bg` #EDF1F7→**#F4F1E8**(ベージュ) / `--sidebar-bg` #0E1726→**#0A2A63**(紺) / 枠線をベージュ調・テキストを navy ink に。sidebar active を amber 強調に。
2. ハードコード残りを一括置換（dead な `hero-demo.tsx` は除外）: `#F97316`→`#FF6B35` / `#2563EB`→`#0B3D91` / rgba 同様。対象: app-sidebar, right-panel, dm-group-shortcut, file-confirm-modal, dashboard(page/plan-status-bar), groups(page/chat), quotes/page。
3. Tailwind 青クラス2箇所を navy arbitrary に: quote-detail の issued バッジ、plan-change-modal の初回契約 info box。
   - 注: 作業画面には方眼(bp-grid)等の重い装飾は入れず、色のみで統一（可読性優先）。

**検証**:
- `tsc --noEmit` ✅ / `npm run build` ✅ exit 0
- ⚠️ ダッシュボード等アプリ内は認証必須で直接スクショ不可。代わりにトークンを使う公開ページ `/privacy` を確認 → ベージュ背景＋navy テキスト＋navy ロゴで破綻なく描画、コントラスト良好。トークンのカスケードが効くことを確認。
- **ユーザー確認待ち**: ダッシュボード実画面の目視（ベージュ背景の強さ・色味の最終OK）。トークン1個なので調整は容易。

**残課題候補**: trial-banner の active 状態は意味的 info としてTailwind青のまま（必要なら navy 化）。dead code `hero-demo.tsx` は削除検討可。

---

## 2026-05-28

### LP を「Blueprint（製図・青写真）」デザインに全面刷新 → 表示検証完了

**背景**: アルファテスター告知に向け、LP の世界観を「建設×製図」に寄せた差別化デザインへ刷新。朝に `/alpha`、夜にホーム `/` を同デザインで統一。

**コミット（全て push 済み = 本番反映済み）**:
- `79710a6` ホーム `/` を Blueprint デザインに全面刷新（page.tsx, 6セクション構成）
- `395e978` `/alpha` v3 — TORU差別化軸の訴求 + プロ品質モーション追加
- `8196bdd` `/alpha` を「TORU 正規 LP（ベータ版）」に再構築
- `ba96deb` `/alpha` を「ブループリント（製図・青焼き）」デザインで全面リデザイン

**デザイン仕様**: 方眼背景 / 濃紺 `#0B3D91` / モノスペースの技術ラベル（DOC. / REV. / SEC NN）/「見積書」アンバー強調 / `components/blueprint-motion.tsx`（ScrollProgress, Reveal, BlueprintParallaxBg 等）。
ホーム構成: Hero(SEC00) → 課題(01) → フロー(02) → 機能(03) → 強み(04) → 料金(05) → FAQ(06) → FinalCta → Footer。

**検証（このセッションで実施）**:
- dev サーバー + Playwright で `/` を 1440 / 390(モバイル) 撮影。
- ⚠️ fullPage 撮影では Hero 以下が空白 → `Reveal` の IntersectionObserver が programmatic 撮影で未発火だっただけ（DOM には全セクション存在、実スクロールで `opacity:0` 残存 **0個**）。実害なし。
- スクロール後の再撮影で全セクション正常描画を確認。コンソールエラー 0。
- 結論: **ホーム Blueprint 刷新は完成・正常動作・本番反映済み**。

**残課題候補（次回判断）**:
- `/` と `/alpha` の役割整理（両方 Blueprint 化済み。アルファ告知でどちらを配るか）
- 実機（スマホ実端末）での最終確認

---

## 2026-05-26

### 🚀 Claude を「事業パートナー」に格上げ + Supabase直接アクセス手段確立

**背景**: ユーザーが「TORU を副業ではなく **AI ビジネスの柱（メイン候補）** として位置付ける」と方針宣言。これに伴い Claude の役割を「実装代行」から「戦略コンサル+実装者」に格上げ。同時に「pending タスクを残さず即実行」「Opus 4.7 をフル活用」の方針も確定。

**実施**:

1. **Supabase Admin SDK 経由の直接 DB アクセス基盤を構築**
   - `npm install @supabase/supabase-js dotenv` 実行（web/ 配下）
   - `scripts/db/client.mjs` 新規作成 — Admin クライアント（service_role キー / RLS バイパス）
   - `scripts/db/ping.mjs` 接続テスト → ✅ 成功
   - これまでユーザーが Supabase SQL Editor で手動実行していた検証系SQLを **Claude が完全自動化** 可能に

2. **P0-① STEP C: クリーンアップ検証 完全実行**（タスク #18）
   - `scripts/db/verify-cleanup.mjs` 作成・実行
   - 結果:
     - (1) ✅ company_member 重複なし（5名ユニーク）
     - (2) ✅ 孤児会社なし（5社全てメンバー存在）
     - (3) ✅ 全員1社のみ所属
     - (4) ✅ developer=ahoyu1031のみ / alpha=aoki1031movieのみ（意図通り）
   - 所属マッピング確定:
     - ahoyu1031@gmail.com → 北陸電工 (team_unlimited)
     - skaken1003@icloud.com → ke (trial)
     - aoki.ai@gmail.com → aoki company (team_unlimited)
     - studioalpha.c.s@gmail.com → 合同会社スタジオアルファ (trial)
     - aoki1031movie@gmail.com → 仮さん（個人）(trial)

3. **`TORU/CLAUDE.md` 新規作成** — ルートレベルの方針定義
   - 「事業パートナー」スタンス4点（戦略視点 / 判断軸提示 / 資源配分 / 能動消化）
   - DB 直接アクセス手段の運用ルール（SELECT自由 / UPDATE目的明確時 / DELETE確認必須）
   - 検証系タスクの即実行ルール
   - Opus 4.7 フル活用方針
   - 既存 `web/CLAUDE.md` は @include で継承

**深夜セッションでの追加実施**:

4. **#16 Webhook 修正完了** — `web/app/api/billing/webhook/route.ts` で stripe_customer_id / stripe_subscription_id を保存。マイグレーション SQL `supabase/migrations/20260526000001_add_stripe_subscription_id.sql` を Supabase SQL Editor で実行済み（カラム追加確認 ✅）

5. **#22 GDPR 対応は「やらない」決定** — MVP フェーズでは過剰防御。削除依頼来たら手動 SQL で対応する運用に。利用規約への1行追記も今夜は見送り。判断軸を `memory/project_toru_mvp_priority.md` に保存。

6. **6年ロードマップ + 来月計画ミーティング骨格** — 独立判定ライン: 月80万円 / 期限: 30歳まで / 戦略: 副業×複数プロダクト。来月の大目標仮: PMF探索（アルファ20名 + 強FB5件）。詳細は明朝以降のセッションで確定。

7. **朝1時間メニュー整備** — `docs/morning-menu.md` 作成（A/B/C/D の選択肢付き）。`docs/x-strategy-drafts.md` 作成（bio・固ツイ・公開記念ポスト案を先回り下書き）。明日朝の即時着手用。

**翌セッション (2026-05-27 朝1時間想定)**:
- 「メニュー〇〇でいきたい」と Claude に伝えれば即着手
- 候補: A(X実投稿) / B(来月計画詳細化) / C(決済テスト) / D(小タスク詰め合わせ)
- 推奨: B（脳冴えてる朝なら）or A（手を動かしたい朝）

---

## 2026-05-25

### アルファテスタープログラム運用整備

**背景**: MVP公開期間中、決済を経由せず無制限利用してもらう「アルファテスター」枠を運用するにあたり、承認フロー・テンプレ・SQL を1か所にまとめる必要があった。

**実施**:
- `docs/alpha-tester-runbook.md` 新規作成（226行）
  - 承認/取消 SQL（コピペ用 + RETURNING付き）
  - メール / X DM テンプレ
  - 状態確認SQL（個別 / 一覧 / 利用状況集計）
  - トラブルシュート表（7症状）
  - developer vs alpha tester の違いを明記（誤って `is_unlimited` を一般ユーザーに付けない）
  - Live切替時の永久半額対応メモ（先着10名・未実装）

**現状の運用フロー確定**:
```
Google Form 申込 → ahoyu1031@gmail.com 通知
→ Supabase で UPDATE users SET is_alpha_tester=true
→ 承認メール送信 → 即時無制限利用可
```

**仮さん (aoki1031movie) 状態確定**:
- `is_unlimited=false / is_alpha_tester=true` （オレンジバッジ）
- 開発者モード（紫バッジ）は `ahoyu1031` 専用に維持

**次タスク候補**: 承認連絡メール下書き整備 / スタジオα・ke へのDM文 / X告知

---

## 2026-05-23

### P0-① 重複所属クリーンアップ 実行 + 隠れバグ修正

**スキーマ発見**:
- `company_member` には `id`, `created_at` が**存在しない**
- 実カラム: `company_id`, `user_id`, `role`, `joined_at`
- 主キーは複合 `(company_id, user_id)` 想定、`ctid` 経由が安全

**実施した修正**:
- `web/lib/get-plan.ts`: `created_at`（実在しない列）参照を `joined_at` に変更 → UNIQUE制約後は `.maybeSingle()` で簡素化
- `web/lib/ensure-company.ts`: 23505（UNIQUE違反）ハンドリング追加 + 孤児会社削除
- `web/app/api/billing/checkout/route.ts`: 同上のガード追加
- ビルド ✅

**Supabase 実行（ユーザー）**:
- STEP A dry-run → KEEP=team_unlimited（cus_UYcp1IlbR7m5NU）/ DELETE=4行 確認OK
- STEP B migration → DELETE 4行 + `UNIQUE(user_id)` 制約付与 完了
- STEP C 検証 → ⏳ ユーザー実行待ち

### Claude Code ステータスバー — 完全復旧

- 3.7.0→3.8.1 再インストール後、`statusLine.command` を `"cs"` に再設定
- `core.py:519` の `LAST_STDIN_FALLBACK_MAX_AGE_S` を再パッチ（600→3600）
- `cs doctor` 全✅、5h/7d/$/cache 全表示確認
- メモリ `feedback_statusbar_check.md` 追加（次回以降の自動診断ルール）

### 🚨 重大バグ発見: 無料配布

`ensure-company.ts:50` で新規ユーザー全員に `plan: "team_unlimited"` を無料配布。Stripe決済が意味を失っている。

### 無料トライアル設計（ユーザー判断確定）

- 無料枠: **10回 / 7日間（先に尽きた方で終了）**
- 機能ロック: **図面解析のみ**（グループは D案: 個人プランでも参加OK、作成はteamのみ）
- 初期プラン状態: `companies.plan = NULL`（未契約）
- 既存25社: **検証後リセット予定**（実ユーザー不在のため）
- UI: 「10回中あと2回」バナー + 終了モーダル → プラン選択誘導

### 進め方プロトコル（明文化・以降この順を厳守）

1. **言語化** — 何を・なぜ・影響範囲・エッジケース
2. **確認** — ユーザー判断ポイント明示 → OK取る
3. **実装** — コード書く、隣接ファイルとの相関性チェック
4. **検証** — `npx tsc --noEmit` → `eslint` → `next build` → `code-review` → 必要なら `verify`
5. **記録** — LOG.md + memory に「なぜ」残す

### 待機中タスク

- ⏳ ユーザー: 検証SQL ①② 実行 → ✅ **5社のみ判明**（25は古いログ）。北陸電工=dev / 仮さん=テスト / 残り3社が要判断
- ⏳ ユーザー: STEP C 検証SQL 実行
- ⏳ ユーザー: リセットSQL 実行可否判断（5社のうちどれを残すか）
- ⏳ Claude: 無料トライアル実装（D案）の drafts 仕上げ

### 無料トライアル実装 進捗（下準備）

**完了**:
- (A) DB migration SQL（companies に `trial_started_at`, `trial_drawings_used`, `trial_ended_reason` 追加 + 既存5社を grandfathered=999 で埋め）→ **ユーザー実行済み**
- (B) `web/lib/ensure-company.ts`: 新規会社作成時 `plan: null` + trial 初期化に変更
- (C) `web/app/api/analyze-drawing/route.ts`: トライアル枠チェック分岐追加（402返却・残数/期間切れで `trialEnded: true`）
- (C') `web/app/(app)/drawings/actions.ts` (`saveDrawingAnalysis`): トライアル消費カウンタ +1 ロジック
- (F) `web/app/(app)/groups/actions.ts` (`createGroup`): D案ガード追加（team プラン以上のみ作成可）
- (G) `web/lib/plan.ts`: `TRIAL_DRAWING_LIMIT=10`, `TRIAL_DURATION_DAYS=7`, `isTrialActive()`, `getTrialStatus()`, `getPlanCapabilities()` 追加。`free` プラン定義削除。`null` プラン対応に全面リファクタ
- ビルド ✅ 全パス通過

**既存5社の処遇（ユーザー判断確定）**:
- 北陸電工（dev / ahoyu1031）: 変更なし、`team_unlimited` + `is_unlimited=true` 維持
- 仮さん（テスト / aoki1031movie）: 変更なし
- Aoki AI（aoki.ai）: 変更なし（自己管理）
- スタジオアルファ（studioalpha.c.s）: 🎁 トライアル状態にリセット（10回付与、データ保持）
- ke（友達 / skaken1003）: 🎁 同上

**機能マトリックス確定（lib/plan.ts に反映）**:
- 図面解析: 全プラン✅（トライアル中は10回まで、有料は月次）
- グループ作成: team プランのみ ❌（D案）
- グループ参加: 全プラン+トライアル ✅（D案）
- 見積作成: 全プラン+トライアル ✅（機能ロック=図面解析のみ方針）
- 単価マスター: 全プラン+トライアル ✅

### UI 実装 完了（同セッション内追加）

**新規ファイル**:
- `web/lib/get-company-trial.ts`: `getCompanyTrial(userId)` - React cache 付き、所属会社の trial_* 情報取得
- `web/components/trial-banner.tsx`: `<TrialBanner>` - active時(青/警告amber)・ended時(赤+CTA)の3状態を1コンポーネントで処理

**変更**:
- `web/lib/get-plan.ts`: 戻り値 `Promise<string>` → `Promise<string | null>` に変更。null=トライアル、文字列=有料プラン
- `web/app/(app)/dashboard/page.tsx`: `planType === null && trial` で TrialBanner、それ以外で PlanStatusBar の分岐表示。`PLAN_LIMITS` から `free` 削除
- `web/app/(app)/settings/plan/page.tsx`: `planType === null` 分岐で「無料体験」表示 + 残数バー追加。`PLAN_FEATURES` `PLAN_ORDER` から `free` 削除
- ビルド ✅ 全ルート通過

**未着手**:
- (E) `<TrialEndedModal>` (一旦バナーの ended 状態で代用、後で必要なら client modal 追加)
- 動作確認（次セッション or 仮さんで実機テスト時）: 新規サインアップ → トライアル → 10回消費 → 終了表示
- コミット & プッシュ → 本番デプロイ（次回ユーザーOK後）

---

## 2026-05-21

### Stripe 決済テスト動作確認 → `users.plan_type` → `companies.plan` 読み元統一

**前日の状況**:
- Stripe Checkout 経由で `team_unlimited` 購入完了、Webhook 4イベント 200 OK
- `companies.plan = team_unlimited` / `companies.stripe_customer_id = cus_UYHY0aD2MIgXCm` も DB に反映済み
- ただし UI は `users.plan_type` を読んでいて `developer 無制限` のままで反映されず

**今回の変更**:
- 新規 `web/lib/get-plan.ts` 追加（React `cache()` で会社プラン解決を request-scoped にメモ化）
  - `getUserPlan(userId)` が `company_member → companies(plan)` を join、未所属なら `"free"` を返す
- 以下6ファイルの読み元を `users.plan_type` → `getUserPlan(user.id)` に統一:
  - `web/app/(app)/settings/plan/page.tsx`
  - `web/app/(app)/dashboard/page.tsx`（リファクタで不要になった `isTeam` / `IndividualDashboard` / `Package` / `FileText` / `Settings` import を削除）
  - `web/app/(app)/unit-prices/page.tsx`
  - `web/app/(app)/groups/new/page.tsx`
  - `web/app/(app)/groups/page.tsx`
  - `web/app/api/analyze-drawing/route.ts`
- ボタン文言を「このプランに変更」→「プラン変更」に短縮（`upgrade-button.tsx`）

**検証**:
- `npx next build` ✅ 5.2秒コンパイル成功、TypeScript 4.7秒成功、ESLint エラー/警告 0

**残タスク**:
- ⏳ `users.is_unlimited` を一時 false にしてダッシュボード/プラン画面で `team (無制限)` 表示と使用量バー表示を実機確認
- ⏳ Webhook で `companies.stripe_subscription_id` も保存（要マイグレーション: カラム未存在）
- ⏳ 本番URLで残り3プラン（individual / team_5 / team_10）の購入動作確認

### `getUserPlan` 複数会社所属バグ修正

**症状**:
- `aoki1031movie@gmail.com`（カリさん、テスト用）は `company_member` に5行所属（テストで重複作成）
- 上で実装した `getUserPlan` は `.maybeSingle()` を使っていたため、複数行で error → `null` → `"free"` 返却
- カリさんの実プラン（最新: `team_unlimited`）が UI で「フリー」表示される乖離が発生

**修正**:
- `web/lib/get-plan.ts` を `.order("created_at", { ascending: false }).limit(1)` 方式に変更
- 複数所属時は最新加入の会社プランを採用
- `npx next build` ✅ 成功

**メモ — 使用量バーが消える件**:
- `settings/plan/page.tsx:107` と `plan-status-bar.tsx:65` が `{!isUnlimited && ...}` で使用量バーを隠す設計
- `ahoyu1031@gmail.com` は `users.is_unlimited = true`（developer）のため意図通り非表示
- テスト時は一時的に false に落とすか、UI 側で developer でも使用量を見せるか要判断

---

## 2026-05-22

### P0 タスク方針確定（実装着手前の言語化フェーズ）

**背景**:
- カリさん（aoki1031movie@gmail.com）が `company_member` に5行重複所属していて UI が「フリー」表示になる問題発覚
- これは MVP 商品化に向けて根幹的バグ（複数会社所属 = 課金カウントズレ・チーム枠圧迫）

**ユーザー判断（実装着手前の合意事項）**:
- P0-① **1ユーザー1会社制約** + 重複クリーンアップ → **最優先で着手**
- P0-② **アカウント完全削除機能**（個人情報保護法・GDPR 対応） → P0-① 完了後に着手
- 重複整理の優先順位: **最新の会社所属を残す**（カリさんなら `cus_UYcp1IlbR7m5NU` / team_unlimited）
- P1（開発環境のみのデータリセットボタン）は MVP に含めない

**進め方**:
1. `company_member` のスキーマ確認 SQL をユーザー実行 → 「最新」判定キー特定
2. 重複ユーザー一覧 SQL で影響範囲確定
3. クリーンアップ migration SQL 作成 → Supabase Dashboard で実行（バックアップ後）
4. `ALTER TABLE company_member ADD CONSTRAINT ... UNIQUE (user_id);`
5. `getUserPlan` を `.maybeSingle()` に戻して簡素化
6. グループ参加・チーム招待で「既に他会社所属」エラー処理追加
7. 「会社を変える」UI（`/settings/company` に追加）
8. ビルド・コミット・プッシュ

**P0-② 設計**:
- `/settings` 内に「危険ゾーン」セクション
- 削除確認モーダル（メール再入力で本人確認）
- 削除対象: users, company_member, drawings（Storage含む）, quotes, unit_price_master, feedback, groups, Stripe Customer
- チーム会社 owner で他にメンバー居る場合は削除不可（先に owner 譲渡）
- API: `DELETE /api/account` → Stripe 先処理 → DB 削除 → Supabase Auth ユーザー削除

### Claude Code ステータスバー消失問題 修正

**原因**:
- `claude-statusbar` の `core.py:519` で `LAST_STDIN_FALLBACK_MAX_AGE_S = 600`（10分）
- Claude が長時間応答中や `--continue` 直後で `last_stdin.json` が10分超古いとキャッシュ復元諦めて "unknown" 表示

**対処**:
- `core.py` の定数を `3600`（1時間）に書き換え
- 注意: `pip install -U claude-statusbar` で消える → 必要なら再パッチ

---

## 2026-05-20

### Stripe 決済機能 実装完了 → Vercel 本番デプロイ準備中

**実装したファイル**（Untracked、未コミット）:
- `web/lib/stripe.ts` — Stripe SDK 初期化（apiVersion: `2026-04-22.dahlia`）
- `web/lib/plan.ts` — `PAID_PLANS`, `getStripePriceId()`, `getPlanFromStripePriceId()` 追加
- `web/app/api/billing/checkout/route.ts` — Stripe Checkout 起動
- `web/app/api/billing/portal/route.ts` — Stripe Billing Portal 起動
- `web/app/api/billing/webhook/route.ts` — Webhook 受信 → `companies.plan` 更新
- `web/app/(app)/settings/plan/upgrade-button.tsx` — プラン変更ボタン Client
- `web/app/(app)/settings/plan/manage-button.tsx` — Portal ボタン Client
- `web/app/(app)/settings/plan/plan-result-toast.tsx` — 成功/失敗 Toast
- `web/app/(app)/settings/plan/page.tsx` — mailto: → Stripe 接続

**ユーザーが用意した情報**:
- Price ID 4種類（`.env.local` 記入済み）:
  - `STRIPE_PRICE_INDIVIDUAL=price_1TY4eCC9LDi3qklHcNIySePE`
  - `STRIPE_PRICE_TEAM_5=price_1TY5xVC9LDi3qklHBjKm94Ss`
  - `STRIPE_PRICE_TEAM_10=price_1TY5y4C9LDi3qklH4oQHLxAO`
  - `STRIPE_PRICE_TEAM_UNLIMITED=price_1TY5zjC9LDi3qklHnmYz3PIp`
- Stripe Secret Key（テストモード）`.env.local` 記入済み
- Stripe CLI で取得した whsec も `.env.local` 記入済み

**検証**:
- `npx tsc --noEmit` ✅ エラー0
- `npx eslint` ✅ エラー0
- `npx next build` ✅ 成功

**Supabase 現状調査結果**（重要発見）:
- `users.plan_type` CHECK: `('beta','individual','team_5','team_10','team_unlimited')`
- `companies.plan` CHECK: `('individual','team_5','team_10','team_unlimited')`（beta なし）
- 実データ: users → beta×4, individual×1 / companies → team_unlimited×25
- **UI は users.plan_type を読んでいる**ため、Stripe Webhook で companies.plan を更新しても画面に反映されない

**次回タスク**（優先順）:
1. ✅ Vercel 環境変数に Stripe キー6個を登録（2026-05-20 完了。全6個「敏感」・「制作とプレビュー」）
2. ✅ コミット & プッシュ（commit c175d35、Vercel 自動デプロイ済み）
3. ✅ Stripe Dashboard で本番URL Webhook エンドポイント登録完了
   - URL: `https://toru-app.vercel.app/api/billing/webhook`
   - イベント4種: `checkout.session.completed` / `customer.subscription.created` / `.updated` / `.deleted`
   - APIバージョン: `2026-04-22.dahlia`（コード側と一致）
   - 本番用 whsec: `whsec_NrdQuyOlUtmMuOo3uOdAITimEt0TYgYt`
4. 🔄 Vercel の `STRIPE_WEBHOOK_SECRET` を本番 whsec に上書き → 再展開
5. ⏳ 本番URLで決済テスト（4242 4242 4242 4242）
6. ⏳ `users.plan_type` → `companies.plan` の読み元統一（8ファイル要リファクタ）

**メモ**:
- ローカル開発用 `web/.env.local` の `STRIPE_WEBHOOK_SECRET` は CLI 用 `whsec_afaf81f1...` をそのまま残す
- Vercel側だけ本番用 `whsec_NrdQuy...` に置き換えることで、本番URL/ローカルを使い分け

**注意**: Vercel の `STRIPE_WEBHOOK_SECRET` には今 Stripe CLI ローカル用の値が入っているため、本番Webhook登録後の `whsec_` で必ず上書きすること。上書き前に「再展開」を押すと決済時にWebhookが署名エラーで弾かれる。

**フィードバック保存済み**:
- 作業ログは `LOG.md` (Git管理) に統一、メモリの worklog_xxx は今後作らない
- TORU は既に Vercel デプロイ済み。新機能テストは本番URLで

---

## 過去ログ（メモリから抜粋）

詳細はメモリ `worklog_20260517.md` `worklog_20260515.md` `worklog_20260510.md` 等を参照。

- **2026-05-17** ベータ廃止・新料金体系・プランゲート実装
- **2026-05-15** フィードバック導線改善・loading.tsx 大量追加・`getCurrentUser/ensureCompany` キャッシュ統一
- **2026-05-10** Vercel デプロイ完了
- **2026-05-04** グループチャットファイル共有完成・ダウンロード fix
- **2026-04-26** 図面解析修正・Slack風UI・actions再作成・seed data・ビルド成功
