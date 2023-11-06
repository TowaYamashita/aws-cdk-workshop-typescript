# URL
https://cdkworkshop.com/ja/20-typescript/70-advanced-topics/200-pipelines.html

---

今まで手元で cdk deploy してたのを AWS CodePipeline 上で実行するようにさせる

# パイプライン入門
- 本番アプリケーションとは分離するため、パイプラインを持つスタックを独立したファイル上に作成する
- パイプラインはアプリケーションスタックをデプロイするためにあるため、エントリポイントを変更してパイプラインをデプロイようにする

```ts
// bin/cdk-workshop.ts
import * as cdk from 'aws-cdk-lib';
import { WorkshopPipelineStack } from '../lib/pipeline-stack';

// エントリポイントをWorkshopPipelineStack(=パイプラインを定義しているスタック)に変更
const app = new cdk.App();
new WorkshopPipelineStack(app, 'CdkWorkshopPipelineStack');
```

# リポジトリの作成
- プロジェクトコードは CodeCommit に格納して、そのコードに変化があったらパイプラインを走らせる
- `codecommit.Repository()` を使って、CodeCommit にリポジトリを作成できる
  - リポジトリを使用するためのGit認証情報を作成されないので、IAMコンソールから手動で作成する

```ts
import * as cdk from 'aws-cdk-lib';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { Construct } from 'constructs';

export class WorkshopPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    new codecommit.Repository(this, 'WorkshopRepo', {
      repositoryName: "WorkshopRepo"
    });
  }
}
```

# パイプラインの作成

```ts
import { Stack, StackProps } from 'aws-cdk-lib';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { Construct } from 'constructs';
import { CodeBuildStep, CodePipeline, CodePipelineSource } from "aws-cdk-lib/pipelines";

export class WorkshopPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const repo = new codecommit.Repository(this, 'WorkshopRepo', {
        repositoryName: "WorkshopRepo"
    });
    // パイプラインの設定
    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'WorkshopPipeline',
      // 依存関係のインストール、ビルド、ソースからCDKアプリケーションの生成を行う
      // 必ず、synth コマンドを実行して終わる必要がある
      synth: new CodeBuildStep('SynthStep', {
        // CDKソースコードが格納されているリポジトリと使うブランチ名
        input: CodePipelineSource.codeCommit(repo, 'main'),
        installCommands: [
          'npm install -g aws-cdk'
        ],
        commands: [
          'npm ci',
          'npm run build',
          'npx run cdk synth'
        ]
      })
    });
  }
}
```

# アプリケーションの追加
- アプリケーションをデプロイするには、そのためのCDKパイプライン上のステージを追加する必要がある
- CDKパイプラインのステージとは、特定の環境に一緒にデプロイする必要のある1つ以上のCDKスタックのセットを表す

```ts
// lib/pipeline-stage.ts
import { CdkWorkshopStack } from './cdk-workshop-stack';
import { Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

// 新しいStage(=パイプラインのコンポーネント)を宣言し、そのステージでアプリケーションスタックをインスタンス化する
export class WorkshopPipelineStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    // アプリケーションスタック
    new CdkWorkshopStack(this, 'WebService');
  }
}
```

- 追加したステージはパイプラインに追加する必要がある

```ts
import { Stack, StackProps } from 'aws-cdk-lib';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { Construct } from 'constructs';
import { WorkshopPipelineStage } from './pipeline-stage';
import { CodeBuildStep, CodePipeline, CodePipelineSource } from "aws-cdk-lib/pipelines";

export class WorkshopPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // 省略

    const pipeline = new CodePipeline(this, 'Pipeline', {
      // 省略
    });

    const deploy = new WorkshopPipelineStage(this, 'Deploy');
    const deployStage = pipeline.addStage(deploy);
  }
}
```

# パイプラインの改善
- CloudFormation スタックの出力は、CloudFormation コンソールの出力タブから確認できる
  - `CfnOutput` コアコンストラクトを使用することで、CloudFormation スタックの出力として宣言できる

```ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { HitCounter } from './hitcounter';
import { TableViewer } from 'cdk-dynamo-table-viewer';

export class CdkWorkshopStack extends cdk.Stack {
  public readonly hcViewerUrl: cdk.CfnOutput;
  public readonly hcEndpoint: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const hello = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'hello.handler',
    });

    const helloWithCounter = new HitCounter(this, 'HelloHitCounter', {
      downstream: hello
    });

    const gateway = new apigw.LambdaRestApi(this, 'Endpoint', {
      handler: helloWithCounter.handler
    });

    const tv = new TableViewer(this, 'ViewHitCounter', {
      title: 'Hello Hits',
      table: helloWithCounter.table,
      sortBy: '-hits'
    });

    // GatewayUrl というIDで APIGateway のURLを出力
    this.hcEndpoint = new cdk.CfnOutput(this, 'GatewayUrl', {
      value: gateway.url
    });

    // TableViewerUrl というIDで TableViewer のURLを出力
    this.hcViewerUrl = new cdk.CfnOutput(this, 'TableViewerUrl', {
      value: tv.endpoint
    });
  }
}
```


# クリーンアップ
- `cdk destroy`を実行するだけだと、パイプラインとそれに関連するAWSリソースしか消えない
- 残りは CloudFormation コンソールから消すスタックを選択して消す
