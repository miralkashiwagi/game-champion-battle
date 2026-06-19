# Champion Battle

ブラウザ向け 1 対 1 オンライン対戦アクションです。

Cloudflare Workers / Durable Objects がマッチングと試合を管理し、クライアントは WebSocket で入力を送信します。移動、攻撃、ガード、装備スキル、HP 0 後の装備パージ、拾得・スワップ、死亡判定、CP 更新、再戦までを実装しています。

現在の実装キャラクターは次の 3 体です。

- `silver_knight`: VRM 1.0 モデルを使用する近距離・バランス型
- `saladin`: VRM 1.0 モデルを使用する近距離・攻撃型
- `syal`: VRM 1.0 モデルを使用する近距離・攻撃型

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
- クライアント描画は Three.js、`@pixiv/three-vrm`、`@pixiv/three-vrm-animation` を使用します。コードから組み立てるスクリプトモデルと VRM 1.0 モデルを同じ Humanoid Bone / Attachment Socket / Motion ID 契約で扱います。

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
| `public/` | HTML、CSS、静的アセット |


## キャラクターデータの構成

各キャラクターは `src/characters/<character_id>/` に置きます。

| ファイル | 内容 |
| --- | --- |
| `definition.ts` | ID、当たり判定、UI 文言、初期装備、素手攻撃、ガードカウンター |
| `behavior.ts` | データだけでは表せない特殊挙動のフック |
| `visual.ts` | スクリプトモデル設定、材質、共通 Visual 情報 |
| `motions.ts` | 素手攻撃とガードカウンターのモーション |
| `index.ts` | 上記を `CharacterRegistration` としてまとめる入口 |

型の契約は `src/shared/character-types.ts`、登録一覧は `src/characters/registry.ts` にあります。画面のキャラクター一覧や `CharacterId` 型はレジストリから自動生成されるため、UI や共通の union 型へ ID を重複記載する必要はありません。

各キャラクターの `definition.ts`、`behavior.ts`、`visual.ts`、`motions.ts` は自己完結させます。現在同じ性能やモーションを持つキャラクターであっても、将来別々に変更する予定ならキャラクター間の継承や共有ファクトリーを作らず、各ディレクトリに設定を保持してください。

装備は`src/equipment/<slot>/<equipment-id>/`に置き、性能、特殊挙動、Visual、Motionを自己完結させます。相手の装備を拾うと、`equipmentId`からスキル、武器コンボ、長押し攻撃、外観を解決します。初期装備はキャラクターの`initialEquipment`で指定します。

## キャラクターを追加する

既存の `silver_knight` または `saladin` をひな型に、次の順で追加します。

1. `src/characters/<character_id>/` を作成し、6 ファイルを用意する。
2. `definition.ts` の `id` と `CharacterDefinition<"<character_id>">` を一致させる。
3. `initialEquipment`、`barehandCombo`、`barehandHoldAttack`、`guardCounter`を定義する。
4. 各攻撃の `motionId` を `motions.ts` が扱う ID と一致させる。
5. `visual.ts`でスクリプトモデル設定またはVRM用Visual情報を定義する。装備Visualは各装備ディレクトリへ置く。
6. 特殊ルールが必要なら `behavior.ts` の `beforeSkill` または `afterHitReceived` を実装する。
7. `index.ts` で `definition`、`behavior`、`visual` をまとめる。
8. `src/characters/registry.ts` に import と登録を 1 件追加する。
9. `test/game.test.mjs` と `test/character-view.test.mjs` に登録、特殊挙動、装備ソケット、モーションのテストを追加する。
10. `npm test`、`npm run typecheck`、`npm run build` を実行し、選択画面と実戦を確認する。

キャラクターIDはURL、保存済み`localStorage`、通信データに使われます。装備種別は独立した`equipmentId`で識別します。

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
- 体格、色、装備形状: `visual.ts`
- ポーズや攻撃モーション: `motions.ts`
- 全キャラクター共通の素手コンボ: `src/characters/common.ts`
- 移動、重力、試合時間、パージ順などの全体値: `src/shared/constants.ts`
- 状態遷移、命中、拾得、死亡などの共通ルール: `src/game/simulation.ts`

仕様書と実装値が異なる場合、ゲームが実際に参照するのは `definition.ts`、`constants.ts`、`simulation.ts` です。仕様を変更したときは、対応する `doc/` も更新して設計意図を残してください。

## 描画モデルとモーションの契約

現在の `ProceduralCharacterView` は、サーバー座標を持つ `root` と、演出で動かせる `visualRoot` を分離しています。攻撃モーションで動かすのは `visualRoot` とボーンだけにし、`root` の座標を変更しないでください。ゲーム上の移動と見た目の移動が二重に適用されるのを防ぐためです。

現行のスクリプトモデルと VRM Rig が提供する Humanoid Bone:

- `hips`
- `spine`
- `chest`
- `head`
- `leftShoulder` / `rightShoulder`
- `leftUpperArm` / `rightUpperArm`
- `leftLowerArm` / `rightLowerArm`
- `leftHand` / `rightHand`
- `leftUpperLeg` / `rightUpperLeg`
- `leftLowerLeg` / `rightLowerLeg`
- `leftFoot` / `rightFoot`

装備ソケット:

- `headAccessory`
- `chestArmor`
- `back`
- `leftHandGrip`
- `rightHandGrip`

状態モーションは `idle`、`move`、`guard`、`hit`、`kneel`、`air`、`stunned`、`down`、`dead`、`pickup` を使用します。走行、被弾、空中被弾、ダウンは骨盤、背骨、肩、肘、膝、足首を含む全身 Humanoid ポーズとして実装し、スクリプトモデルと VRM の両方へ適用します。攻撃中はサーバースナップショットの `activeActionId`（攻撃の `motionId`）と `actionStartedFrame` から同じ攻撃の再実行も識別します。

## VRM モデル

VRM は version 1.0 系を前提とします。`@pixiv/three-vrm` の normalized Humanoid Bone を既存の `CharacterRig` 契約へ割り当てるため、VRM 1.0 の前方向へ追加の 180 度回転を適用しないでください。向きは `gameRoot` がサーバーの `facing` から決定します。

VRM キャラクターは `definition.ts` の `visualProfile` に `renderer: "vrm"`、モデル URL、`scale`、`groundOffset`、フォールバック方式を設定します。VRM は非同期で読み込み、ロード中または失敗時には中立グレーの共用スクリプトモデルを表示します。

VRM の normalized Bone へは `AnimationMixer` で VRMA を再生します。VRM ファイル内に AnimationClip がない場合も、`public/assets/motions/` 配下の VRMA と既存の `motionId` 対応表で動作します。ゲームロジックは表示方式を分岐せず、攻撃判定は引き続き `activeActionId` と `actionStartedFrame` を参照します。

VRM アセットはキャラクターディレクトリに置き、ビルド時に `dist/client/characters/<character_id>/` へコピーします。接地、前後方向、倍率、装備Socket、全状態モーションをブラウザで確認してください。

VRM 化しても戦闘判定は `simulation.ts` の 2D 座標と `definition.collision` を使用します。モデルの身長、メッシュ、衣装、アニメーションから判定や攻撃範囲を生成してはいけません。

## VRMA モーション

現在の正式VRMA素材は、リポジトリに存在する次の19本です。新しいファイルを前提にせず、足りない専用モーションは既存clipへの明示fallbackとして登録します。

| 分類 | ファイル |
| --- | --- |
| common | `idle.vrma`, `walk.vrma`, `run.vrma`, `turn.vrma` |
| air | `jump-start.vrma`, `jump-loop.vrma`, `jump-end.vrma` |
| combat | `block.vrma`, `headbutt.vrma`, `punch-01.vrma`, `punch-02.vrma`, `punch-03.vrma`, `slash-to-left.vrma`, `slash-to-right.vrma`, `slash-up.vrma` |
| reaction | `hit.vrma`, `crumple-stun.vrma`, `knockdown.vrma`, `get-up.vrma` |

VRMロード後の Silver Knight、Saladin、Syal は `VrmaCharacterMotionPlayer` を使います。VRMロード中またはロード失敗時だけ、各キャラクターのscript fallbackを表示します。

装備由来のVRMAは各装備の `motions.ts` で `vrmaMotions` として選びます。`src/client/vrma-motion-registry.js` は共通状態・素手・ガードカウンターを持ち、装備攻撃や装備スキルは `EQUIPMENT_REGISTRY` から `vrmaMotions` を収集します。装備ごとにVRMAを差し替える場合は、その装備ディレクトリ内の `motions.ts` を編集してください。

| 状態 / motionId | VRMA |
| --- | --- |
| `idle` | `common/idle.vrma` |
| `move`, `walkForward` | `common/walk.vrma` |
| `dash`, `runForward` | `common/run.vrma` |
| `guard`, `common_guard_counter`, windwall系 | `combat/block.vrma` |
| `barehand_1..3` | `combat/punch-01..03.vrma` |
| combo slash系 | `combat/slash-to-left.vrma`, `slash-to-right.vrma`, `slash-up.vrma` |
| thrust / forward cut / body charge / lunar slash系 | 専用素材がないため既存slash clipへfallback |
| `hit`, `kneel`, `stunned`, `down`, `dead` | `reaction/` 配下の既存clipへ対応 |

共通状態VRMAを差し替える場合は、同じパスのファイルを置き換えるか `vrma-motion-registry.js` を更新してください。装備由来VRMAを差し替える場合は、各装備の `motions.ts` の `vrmaMotions` を更新してください。`walk-backward`、`strafe-*`、専用 `thrust`、専用 `death` は現状未配置のため、`scripts/validate-vrma.mjs` では警告として扱います。

```powershell
node scripts/validate-vrma.mjs
```

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
