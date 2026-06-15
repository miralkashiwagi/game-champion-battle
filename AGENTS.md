# AGENTS.md

## General
- このプロジェクトは、スクリプトモデルとVRMモデルを同じRig、Socket、Motion契約で扱う。
- VRMはversion 1.0系を前提とする。
- キャラクター関連の変更では、見た目の調整だけであってもゲームロジックとの責務分離を維持する。

## Character Architecture

キャラクターは次の責務に分離する。

- `definition.ts`: 判定値、素手攻撃、ガードカウンター、初期装備IDなどのゲームデータ
- `behavior.ts`: キャラクター固有の特殊なゲーム挙動
- `visual.ts`: スクリプトモデル設定と材質
- `motions.ts`: 素手攻撃とガードカウンターのモーション実装
- `ScriptRigAdapter`: Humanoid BoneとAttachment Socketの解決
- `ScriptMotionPlayer`: キャラクター非依存のモーション進行管理

VRM実装も同じBone、Socket、Motion ID契約を使用する。既存のゲームロジックをVRM用に分岐させない。

将来別キャラクターとして調整する予定のキャラクター同士で、`definition.ts`、`behavior.ts`、`visual.ts`、`motions.ts`を継承または共有ファクトリー化しない。初期値が同じでも各キャラクターディレクトリへ自己完結した設定を置く。

装備は`src/equipment/<slot>/<equipment-id>/`に置き、`definition.ts`、`behavior.ts`、`visual.ts`、`motions.ts`、`index.ts`へ責務分離する。装備性能、装備スキル、武器コンボ、武器長押し攻撃は`EquipmentDefinition`に置き、解決には`equipmentId`と`EQUIPMENT_REGISTRY`を使用する。

## Required Boundaries

### Game Logic

- キャラクター判定値は`CharacterDefinition`、装備攻撃範囲などの装備性能は`EquipmentDefinition`側に置く。
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
- 装備の性能、Visual、Behavior、Motionを出身キャラクターIDやキャラクター登録から解決してはならない。
- スクリプトモデルもVRM互換の階層を維持し、脚は`hips`配下、胸は`spine`配下、前腕は上腕配下、下腿は大腿配下に置く。

### Motions

- すべての攻撃に安定した`motionId`を設定する。
- ネットワーク上のモーション開始判定には`activeActionId`と`actionStartedFrame`を使用する。
- `ScriptMotionPlayer`、`character-view.js`、`scene.js`で`characterId === "..."`によるキャラクター固有分岐を追加してはならない。
- キャラクター固有の体型と材質は`visual.scriptModel`、State Motion設定は登録された`motionController`に置く。
- 装備由来の攻撃モーションは各装備の`motions.ts`、素手攻撃とガードカウンターは各キャラクターの`motions.ts`に置く。
- 新キャラクターを追加するときに共有Motion PlayerやSceneの編集を必要とする設計にしない。

## VRM Compatibility Rules

- VRMはversion 1.0系とnormalized Humanoid Boneを前提とする。
- VRM 1.0モデルへ固定の`rotation.y = Math.PI`を加えない。前後方向は`gameRoot`の`facing`だけで制御する。
- ゲームロジックは表示方式が`script`か`vrm`かを意識しない。
- VRMモデル導入時も`definition.collision`と攻撃定義を維持し、モデル形状から判定を生成しない。
- VRM用装備も既存のAttachment Socket名を使用し、モデル固有のボーン名をゲームデータへ漏らさない。
- VRM用AnimationClipやVRMAは既存の`motionId`へ割り当てる。
- VRMのロード中またはロード失敗時は共用スクリプトモデルへフォールバックする。
- スクリプトモデル固有の`proportions`や材質設定を`CharacterDefinition`のゲームデータへ移動しない。
- VRMとスクリプトモデルは`hips`、`spine`、`chest`、`head`、左右の`Shoulder`、`UpperArm`、`LowerArm`、`Hand`、`UpperLeg`、`LowerLeg`、`Foot`を提供する。
- 走行、被弾、空中被弾、ダウンは骨盤、背骨、肩、肘、膝、足首を使う全身Humanoidモーションとして実装する。
- VRMファイル内にAnimationClipがない場合も`motions.ts`と共通State Motionで動作可能にする。

## Character Change Checklist

キャラクター追加またはビジュアル変更時に以下を確認する。

1. ゲーム性能の変更は`definition.ts`だけで完結している。
2. スクリプトモデル固有データは`visual.ts`または`motions.ts`にある。
3. 装備がBoneではなくSocketへ接続されている。
4. 共有クライアントコードにキャラクターID分岐を追加していない。
5. 攻撃モーションが`gameRoot`のサーバー座標を変更していない。
6. 通常時に判定デバッグ表示が出ない。
7. 同じ攻撃を連続実行しても`actionStartedFrame`によりモーションが再開する。
8. 新しいキャラクターをレジストリへ追加するだけで共有Sceneが表示できる。
9. VRM 1.0モデルの前後方向、接地、`visualProfile.scale`、装備位置が正しい。
10. スクリプトモデルとVRMの両方で肩、肘、膝、足首を含む状態モーションが破綻しない。
11. 将来分離予定のキャラクターが別キャラクターの設定ファイルや共有ファクトリーを継承していない。

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
- VRMロード失敗時に共用スクリプトモデルで操作を継続できる
- VRMとスクリプトモデルが同じHumanoid Bone階層で走行、空中被弾、ダウンを再生する
