# Champion Battle

ブラウザ向け 1 対 1 オンライン対戦アクションです。

Cloudflare Workers / Durable Objects がマッチングと試合を管理し、クライアントは WebSocket で入力を送信します。移動、攻撃、ガード、装備スキル、HP 0 後の装備パージ、拾得・スワップ、死亡判定、CP 更新、再戦までを実装しています。

現在の実装キャラクターは次の 2 体です。

- `silver_knight`: 近距離・バランス型
- `saladin`: 近距離・攻撃型

## セットアップ

必要なもの:

- Node.js
- npm
- Cloudflare アカウント（デプロイ時のみ）

```powershell
npm install
npm run dev
```

主なコマンド:

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | クライアントをビルドして `wrangler dev` を起動 |
| `npm run build` | `public/` とクライアントバンドルを `dist/client/` に生成 |
| `npm test` | Node.js のテストを実行 |
| `npm run typecheck` | TypeScript の型チェック |
| `npm run deploy` | ビルド後に Cloudflare Workers へデプロイ |

`dist/` は生成物です。直接編集せず、`public/` または `src/` を変更してください。

## 操作

| キー | 操作 |
| --- | --- |
| `A` / `D` | 左右移動 |
| `W` | ジャンプ |
| `J` | 通常攻撃。ホールド後に離すと D ホールド攻撃 |
| `K` | ガード |
| `E` | 装備を拾う |
| `1` | マントスキル |
| `2` | 頭スキル |
| `3` | 胴スキル |
| `4` | 武器スキル |
| `H` | 攻撃判定・被判定のデバッグ表示 |

## アーキテクチャ

- サーバー authoritative 方式です。クライアントは入力だけを送り、命中、ダメージ、装備、勝敗はサーバーが確定します。
- `MatchmakerDurableObject` が CP によるマッチングを行います。
- `MatchDurableObject` が WebSocket、試合状態、再戦処理を管理します。
- `MatchSimulation` が 60 tick/sec で戦闘を進め、スナップショットは 20 回/sec で配信されます。
- クライアント描画は Three.js です。現在のキャラクターはコードから組み立てる簡易 3D モデルで、VRM はまだ読み込んでいません。

主要ディレクトリ:

| パス | 役割 |
| --- | --- |
| `src/worker.ts` | HTTP / WebSocket の入口 |
| `src/matchmaker-object.ts` | マッチング Durable Object |
| `src/match-object.ts` | 試合 Durable Object |
| `src/game/simulation.ts` | 戦闘ルールと状態遷移 |
| `src/shared/` | 通信型、定数、キャラクター共通型 |
| `src/characters/` | キャラクター固有の設定、挙動、見た目、モーション |
| `src/client/` | UI、Three.js シーン、キャラクター描画 |
| `public/` | HTML、CSS、同梱 Three.js |


## キャラクターデータの構成

各キャラクターは `src/characters/<character_id>/` に置きます。

| ファイル | 内容 |
| --- | --- |
| `definition.ts` | ID、当たり判定、UI 文言、通常攻撃、スキル、CT などのゲーム設定 |
| `behavior.ts` | データだけでは表せない特殊挙動のフック |
| `visual.js` | 現在のスクリプトモデル、装備、フィールドアイテムの形状 |
| `motions.js` | キャラクター固有の攻撃モーション |
| `visual.d.ts` | JavaScript 製 Visual の TypeScript 型宣言 |
| `index.ts` | 上記を `CharacterRegistration` としてまとめる入口 |

型の契約は `src/shared/character-types.ts`、登録一覧は `src/characters/registry.ts` にあります。画面のキャラクター一覧や `CharacterId` 型はレジストリから自動生成されるため、UI や共通の union 型へ ID を重複記載する必要はありません。

装備はキャラクター本体とは別のインスタンスです。相手の装備を拾うと、その装備の `originCharacterId` に対応するスキル、武器コンボ、D ホールド攻撃、外観を使用します。このため、新キャラクターの装備は別キャラクターのリグへ装着しても破綻しないことが必要です。

## キャラクターを追加する

既存の `silver_knight` または `saladin` をひな型に、次の順で追加します。

1. `src/characters/<character_id>/` を作成し、6 ファイルを用意する。
2. `definition.ts` の `id` と `CharacterDefinition<"<character_id>">` を一致させる。
3. `combo`、`barehandCombo`、`holdAttack`、`guardCounter`、4 部位の `skills` を定義する。
4. 各攻撃の `motionId` を `motions.js` が扱う ID と一致させる。
5. `visual.js` で本体の体格、4 部位の装備、ドロップ時のフィールド表示を定義する。
6. 特殊ルールが必要なら `behavior.ts` の `beforeSkill` または `afterHitReceived` を実装する。
7. `index.ts` で `definition`、`behavior`、`visual` をまとめる。
8. `src/characters/registry.ts` に import と登録を 1 件追加する。
9. `test/game.test.mjs` と `test/character-view.test.mjs` に登録、特殊挙動、装備ソケット、モーションのテストを追加する。
10. `npm test`、`npm run typecheck`、`npm run build` を実行し、選択画面と実戦を確認する。

キャラクター ID は URL、保存済み `localStorage`、通信データ、装備の生成元 ID に使われます。公開後の ID 変更は既存データとの互換性に影響するため、表示名だけを変える場合は `ui.name` を変更してください。

### 攻撃・スキル設定

主な `AttackSpec` / `SkillSpec` の意味:

| 項目 | 内容 |
| --- | --- |
| `damage` | HP ダメージ |
| `range` | 横方向の攻撃リーチ。防御側の `collision.halfWidth` が加算される |
| `startupFrames` | 発生前フレーム |
| `activeFrames` | 攻撃判定の有効フレーム |
| `recoveryFrames` | 攻撃後の硬直フレーム |
| `effect` | `hitstun`、`kneel`、`air`、`down`、`stun` |
| `guardPierce` | ガードを貫通するか |
| `movement` | 発生から持続中に進む合計距離 |
| `invulnerable` | 発生から持続終了まで無敵にするか |
| `cooldownMs` | スキルのクールタイム |
| `startReady` | 試合開始時に使用可能か |
| `passive` | 入力で発動しないパッシブか |
| `usableWhileHit` | 通常の行動不能中にも使用を試みるか |

フレーム値は 60 tick/sec 基準です。現在のシミュレーションでは `activeFrames` の終端を含む判定になっているため、調整時はテストと実プレイの両方で確認してください。

## 既存キャラクターを変更する

変更内容に応じて編集場所を分けます。

- 名前、説明、タイプ、テーマカラー: `definition.ts` の `ui`
- ダメージ、リーチ、フレーム、CT、ガード貫通: `definition.ts`
- 本体サイズ: `definition.ts` の `collision`
- 描画倍率、接地位置: `definition.ts` の `visualProfile`
- 被撃時や発動時の特殊処理: `behavior.ts`
- 体格、色、装備形状: `visual.js`
- ポーズや攻撃モーション: `motions.js`
- 全キャラクター共通の素手コンボ: `src/characters/common.ts`
- 移動、重力、試合時間、パージ順などの全体値: `src/shared/constants.ts`
- 状態遷移、命中、拾得、死亡などの共通ルール: `src/game/simulation.ts`

仕様書と実装値が異なる場合、ゲームが実際に参照するのは `definition.ts`、`constants.ts`、`simulation.ts` です。仕様を変更したときは、対応する `doc/` も更新して設計意図を残してください。

## 描画モデルとモーションの契約

現在の `ProceduralCharacterView` は、サーバー座標を持つ `root` と、演出で動かせる `visualRoot` を分離しています。攻撃モーションで動かすのは `visualRoot` とボーンだけにし、`root` の座標を変更しないでください。ゲーム上の移動と見た目の移動が二重に適用されるのを防ぐためです。

現行モデルが提供するボーン:

- `hips`
- `chest`
- `head`
- `leftUpperArm` / `rightUpperArm`
- `leftUpperLeg` / `rightUpperLeg`

装備ソケット:

- `headAccessory`
- `chestArmor`
- `back`
- `leftHandGrip`
- `rightHandGrip`

状態モーションは `idle`、`move`、`guard`、`hit`、`kneel`、`air`、`stunned`、`down`、`dead`、`pickup` を使用します。攻撃中はサーバースナップショットの `activeActionId`（攻撃の `motionId`）と `actionStartedFrame` から同じ攻撃の再実行も識別します。

## VRM へ置き換える場合

現状の型と描画クラスは `renderer: "script"` および `ProceduralCharacterView` に固定されているため、VRM ファイルを置くだけでは切り替わりません。次の順で描画層を拡張してください。

1. `@pixiv/three-vrm` と GLTF ローダーを導入し、VRM アセットの配置先とライセンスを決める。
2. `CharacterVisualProfile` を `script | vrm` の判別可能な型へ変更し、VRM の URL、倍率、接地補正などを持たせる。
3. `ProceduralCharacterView` と同じ外部 API を持つ `VrmCharacterView` を作る。少なくとも `root`、`update`、`syncEquipment`、`setDebugVisible`、破棄処理が必要になる。
4. `scene.js` の直接 `new ProceduralCharacterView(...)` をファクトリー呼び出しへ変更し、`renderer` に応じて生成クラスを選ぶ。
5. VRM の Humanoid ボーンを現在のボーン名へ対応付けるリグアダプターを作る。
6. 4 部位の装備ソケットを VRM ボーン配下に作り、他キャラクター由来の装備も装着できるようにする。左右の武器を使うキャラクターでは両手ソケットが必須。
7. `motionId` を VRM の AnimationClip または独自ポーズ処理へ対応付ける。サーバー側の攻撃 ID とフレーム値は描画方式に依存させない。
8. フィールド上の装備表示は VRM 本体から分離し、現在の `createFieldItem` 相当を維持する。
9. 非同期ロード中の代替表示、ロード失敗、モデルのキャッシュ、dispose、複数体表示時のメモリ使用量を扱う。
10. 接地、向き、スケール、当たり判定表示、装備の着脱・スワップ、全状態・全攻撃を実機確認する。

VRM 化しても戦闘判定は `simulation.ts` の 2D 座標と `collision` を使います。モデルのメッシュやアニメーションから当たり判定を自動生成しない限り、見た目を変えた後は `collision.halfWidth`、`collision.height`、攻撃の `range` を手動で合わせる必要があります。

一部キャラクターだけを先に VRM 化する場合も、装備スワップがあるため「スクリプトモデルの装備を VRM に付ける」「VRM キャラクターの装備をスクリプトモデルに付ける」の両方向を確認してください。装備を汎用ソケット形式に保つと移行しやすくなります。

## テスト時の確認項目

自動テストに加え、キャラクター変更時は次を確認してください。

- 選択画面、詳細画面、ロビーに追加キャラクターが表示される
- 同キャラ戦と異キャラ戦の両方が開始できる
- 通常コンボ、ホールド攻撃、ガードカウンター、4 スキルが動作する
- 武器喪失時に素手コンボへ切り替わる
- 相手の武器取得時にコンボ、ホールド攻撃、スキル、外観が生成元キャラクターのものへ切り替わる
- CT が装備のドロップ中とスワップ後にも引き継がれる
- パージ順がマント、頭、胴、武器で、全装備喪失後の被弾で死亡する
- モーション中もサーバー座標と表示座標がずれない
- 装備着脱を繰り返しても Three.js オブジェクトや素材が残留しない
