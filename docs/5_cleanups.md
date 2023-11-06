# URL
https://cdkworkshop.com/ja/20-typescript/60-cleanups.html

---

# スタックのクリーンアップ

- `cdk destroy` を実行することで、スタックを破棄（＝作成したリソースを削除）できる
- 全部が全部削除されるわけではないことに注意

- DynamoDB のテーブル
  - DynamoDB のテーブルを作成する際に、removalPolicy に `RemovalPolicy.DESTROY` を指定しておけば、`cdk desroy` 実行時に削除される

| ポリシー | 説明 |
| -------- | ---- |
| RemovalPolicy.DESTROY | `cdk destroy` 実行時に削除される|
| RemovalPolicy.RETAIN | `cdk destroy` 実行時に削除されずリソースはアカウント内で保持される|
| RemovalPolicy.SNAPSHOT | `cdk destroy` 実行時に、データのスナップショットを保存する ※データベースやEC2ボリュームなどの一部のステートフルリソースでのみ利用可能|
| RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE | リソースが削除または置換される際にリソースを保持する。作成がロールバックされた場合は保持しない。(=使用中のリソースとそのデータは保持される一方で、新規や未使用のリソースは削除される)|

- Lambda関数が作成した CloudWatch のログ
  - CloudFormation で追跡されないため、不要なら手動でコンソールから消す
- ブートストラップスタック
  - CloudFormation のコンソールから CDKToolkit スタックを消す
  - ブートストラップで作成された S3 バケットは 空にしてから消す

