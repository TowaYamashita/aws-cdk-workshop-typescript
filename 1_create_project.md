# URL
https://cdkworkshop.com/ja/20-typescript/20-create-project.html

---

# cdk init
- `cdk init <プロジェクト名> --language <使用する言語名>` を実行することで AWS CDK プロジェクトが作成される 
 
# プロジェクトの構造
作成されるディレクトリやファイルは以下の通り

- .gitignore
- .npmignore
- README.md(`npm run build` や `npm run watch` などの便利コマンド一覧とその説明)
- bin(CDK アプリケーションのエントリポイントとなるファイル置き場)
- cdk.json(CDK アプリケーションの実行方法をツールキットに指示させるためのファイル)
- jest.config.js(Jest(今回使用するテストフレームワーク)の設定ファイル)
- lib(CDK アプリケーションのスタックを定義するファイル置き場)
- node_modules
- package-lock.json
- package.json
- test(CDK アプリケーションに対するテストコードを書くファイル置き場)
- tsconfig.json(プロジェクトの TypeScript 設定ファイル)

```ts
// bin/cdk-workshop.ts(エントリーポイント)
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkWorkshopStack } from '../lib/cdk-workshop-stack';

const app = new cdk.App();
// lib/cdk-workshop-stack.ts から CdkWorkShopStack クラスをロードしてインスタンス化する
new CdkWorkshopStack(app, 'CdkWorkshopStack');

// lib/cdk-workshop-stack.ts
import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

// CDK スタックによってアプリケーションが作成される
export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // SQSキュー
    const queue = new sqs.Queue(this, 'CdkWorkshopQueue', {
      visibilityTimeout: Duration.seconds(300)
    });

    // SNSトピック
    const topic = new sns.Topic(this, 'CdkWorkshopTopic');

    // SNSトピックに配信されたメッセージを受信するようにSQSキューを購読する
    topic.addSubscription(new subs.SqsSubscription(queue));
  }
}
```
  
# cdk synth
- `cdk synth` を実行することでCDK アプリケーションが合成される
  - `cdk.json` が配置されているディレクトリ上でコマンドを実行する必要がある

> 合成: アプリケーションで定義されたスタックごとに AWS CloudFormationテンプレートが生成されること

# cdk deploy
- CDK アプリケーションを環境（アカウント/リージョン）に初めてデプロイするときは、Bootstrap スタックをインストールする必要がある
- `cdk bootstrap` を実行することで Bootstrap スタックをインストールできる

> Bootstrap スタック: CDK ツールキットの操作に必要なリソース(例: デプロイプロセス中にテンプレートやアセットを保存するためのS3バケット) が含まれているスタック

- `cdk deploy` を実行することで CDK アプリケーションをデプロイできる
  - デプロイ時に指定したセキュリティレベルにひっかかるセキュリティに関するリスクがある場合は警告が出る
  - `cdk deploy --require-approval <レベル>` を実行することで、セキュリティレベルを指定しつつデプロイできる

|レベル|意味|
|:--|:--|
|never|承認は不要です|
|any-change|IAM security-group-related または変更には承認が必要
|broadening(デフォルト)|IAM ステートメントまたはトラフィックルールが追加される場合は承認が必要ですが、削除には承認は必要ありません|

> https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/cli.html#cli-deploy

- CDK アプリケーションは AWS CloudFormation を通じてデプロイされるため、各CDKスタックとCloudFormationスタックは1:1でマッピングされる
- デプロイした CDK アプリケーションは AWS CloudFormation コンソールから確認できる
> https://us-east-1.console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks