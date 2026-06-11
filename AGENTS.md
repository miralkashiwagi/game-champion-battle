# AGENTS.md

## General
- このプロジェクトは、現在のスクリプトモデルを維持しつつ、将来VRMモデルへ差し替えられる構造を前提とする。
- キャラクター関連の変更では、見た目の調整だけであってもゲームロジックとの責務分離を維持する。

## Character Architecture

キャラクターは次の責務に分離する。

- `definition.ts`: 性能、判定値、攻撃フレーム、`motionId`などのゲームデータ
- `behavior.ts`: スキルや被弾時の特殊なゲーム挙動
- `visual.js`: スクリプトモデルの体型、材質、装備Visual
- `motions.js`: スクリプトモデル固有のモーション実装
- `ScriptRigAdapter`: Humanoid BoneとAttachment Socketの解決
- `ScriptMotionPlayer`: キャラクター非依存のモーション進行管理

将来のVRM実装は、同じBone、Socket、Motion ID契約を満たす別レンダラーとして追加する。既存のゲームロジックをVRM用に分岐させない。

## Required Boundaries

### Game Logic

- 当たり判定、移動制限、攻撃範囲などのゲーム性能は`CharacterDefinition`側に置く。
- 判定値は`definition.collision`から参照する。
- `src/game`とサーバー処理から`visualProfile`、`scriptModel`、Three.jsオブジェクト、メッシュ寸法を参照してはならない。
- VRMやスクリプトモデルの身長、体格、衣装、実メッシュ形状からゲーム性能を計算してはならない。

### Rendering

- `gameRoot`はサーバー座標と向きだけを反映する。
- `visualRoot`は踏み込み、回転、揺れなどの表示専用モーションに使用する。
- モーションから`gameRoot`のX/Z座標やサーバー上の判定値を変更してはならない。
- 判定デバッグ表示は`collisionDebug`が有効な場合だけ表示する。通常プレイ中に表示してはならない。

### Rig And Equipment

- 装備やモーションは`parts.rightArm`などのスクリプトモデル内部構造を直接参照しない。
- Bone操作は`CharacterRig.getBone(HumanoidBoneName)`を使用する。
- 装備接続は`CharacterRig.getSocket(AttachmentSocket)`を使用する。
- 武器、盾、兜、鎧、外套の接続先は`EquipmentAttachment.socket`で宣言する。
- 装備は必要になった時点で生成し、アイテムIDが変わった場合に交換・破棄する。全キャラクターの全装備を事前生成しない。

### Motions

- すべての攻撃に安定した`motionId`を設定する。
- ネットワーク上のモーション開始判定には`activeActionId`と`actionStartedFrame`を使用する。
- `ScriptMotionPlayer`、`character-view.js`、`scene.js`で`characterId === "..."`によるキャラクター固有分岐を追加してはならない。
- キャラクター固有の体型、材質、State Motion設定は`visual.scriptModel`に置く。
- キャラクター固有の攻撃モーションは各キャラクターの`motions.js`に置き、`motionController`として登録する。
- 新キャラクターを追加するときに共有Motion PlayerやSceneの編集を必要とする設計にしない。

## VRM Compatibility Rules

- ゲームロジックは表示方式が`script`か`vrm`かを意識しない。
- VRMモデル導入時も`definition.collision`と攻撃定義を維持し、モデル形状から判定を生成しない。
- VRM用装備も既存のAttachment Socket名を使用し、モデル固有のボーン名をゲームデータへ漏らさない。
- VRM用AnimationClipやVRMAは既存の`motionId`へ割り当てる。
- VRMロード失敗時にスクリプトモデルへフォールバックできる構造を維持する。
- スクリプトモデル固有の`proportions`や材質設定を`CharacterDefinition`のゲームデータへ移動しない。

## Character Change Checklist

キャラクター追加またはビジュアル変更時に以下を確認する。

1. ゲーム性能の変更は`definition.ts`だけで完結している。
2. スクリプトモデル固有データは`visual.js`または`motions.js`にある。
3. 装備がBoneではなくSocketへ接続されている。
4. 共有クライアントコードにキャラクターID分岐を追加していない。
5. 攻撃モーションが`gameRoot`のサーバー座標を変更していない。
6. 通常時に判定デバッグ表示が出ない。
7. 同じ攻撃を連続実行しても`actionStartedFrame`によりモーションが再開する。
8. 新しいキャラクターをレジストリへ追加するだけで共有Sceneが表示できる。

## Required Verification

キャラクター関連を変更した場合は、最低限以下を実行する。

```powershell
npm test
npm run typecheck
npm run build
```

加えて、以下の回帰テストを維持する。

- 装備が必要時だけ生成され、正しいSocketへ接続される
- 双剣や盾など複数Attachmentを持つ装備が正しく接続される
- 攻撃モーションが`gameRoot`の座標を変更しない
- キャラクター固有モーションがVisual登録から解決される
- 判定表示がデバッグ有効時だけ表示される
- `activeActionId`と`actionStartedFrame`が攻撃開始ごとに更新される
