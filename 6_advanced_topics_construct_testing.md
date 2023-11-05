# URL
https://cdkworkshop.com/ja/20-typescript/70-advanced-topics/100-construct-testing.html

---

# コンストラクトのテスト
- `aws-cdk-lib/assertions` ライブラリを使用することで、CDK スタックに対してユニットテストとインテグレーションテストを書ける

# アサーションテスト
- アサーションテストとは、生成されたスタックのCloudFormationテンプレートが特定のリソースやプロパティを含んでいることを検証するテストである
- testsディレクトリ配下にテストコードを書いたファイルを置く
- `npm run test` を実行することでテストを実行できる

## 例1: HitCounter コンストラクト 内に DynamoDB テーブルが1つだけ含まれていることを確認する
```ts
import { Template } from 'aws-cdk-lib/assertions';
import { Stack } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { HitCounter }  from '../lib/hitcounter';

test('DynamoDB Table Created', () => {
  const stack = new Stack();
  
  // テスト対象の HitCounter コンストラクトを生成
  new HitCounter(stack, 'MyTestConstruct', {
    downstream:  new lambda.Function(stack, 'TestFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'hello.handler',
      code: lambda.Code.fromAsset('lambda')
    })
  });

  const template = Template.fromStack(stack);
  
  // リソースの種類が「AWS::DynamoDB::Table」のリソースが1つあることを確かめる
  template.resourceCountIs("AWS::DynamoDB::Table", 1);
});
```

## 例2: HitCounter コンストラクト内の Lambda 関数に適切な環境変数があることを確認する
```ts
import { Template, Capture } from 'aws-cdk-lib/assertions';
import { Stack } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { HitCounter }  from '../lib/hitcounter';

test('Lambda Has Environment Variables', () => {
  const stack = new Stack();

  // テスト対象の HitCounter コンストラクトを生成
  new HitCounter(stack, 'MyTestConstruct', {
    downstream: new lambda.Function(stack, 'TestFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'hello.handler',
      code: lambda.Code.fromAsset('lambda')
    })
  });

  // Lambda 関数の環境変数(functionName, tableName)の値は、CDK が自動で決定するためわからない
  // そのため、環境変数をキャプチャしておいてそれと比較する
  const template = Template.fromStack(stack);
  const envCapture = new Capture();
  template.hasResourceProperties("AWS::Lambda::Function", {
    Environment: envCapture,
  });

  // キャプチャした環境変数の値と Lambda関数の環境変数の値が一致することを確認する
  expect(envCapture.asObject()).toEqual(
    {
      Variables: {
        DOWNSTREAM_FUNCTION_NAME: {
          Ref: "TestFunction22AD90FC",
        },
        HITS_TABLE_NAME: {
          Ref: "MyTestConstructHits24A357F0",
        }
      }
    }
  );
});
```

# バリデーションテスト
- バリデーションテストとは、スタックやコンストラクトが満たすべきビジネスロジックや制約条件をチェックするテストである

## 例1: HitCounter コンストラクトの readCapacity に不正な値を渡したらエラーを吐くことを確認する
```ts
import { Stack } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { HitCounter }  from '../lib/hitcounter';

test('read capacity can be configured', () => {
  const stack = new Stack();

  // HitCounter コンストラクトの readCapacity に不正な範囲の値を渡したらエラーが渡されることを確認する
  expect(() => {
    new HitCounter(stack, 'MyTestConstruct', {
      downstream: new lambda.Function(stack, 'TestFunction', {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'hello.handler',
        code: lambda.Code.fromAsset('lambda')
      }),
      readCapacity: 3
    });
  // toThrowError は 非推奨になっているため、代わりに toThrow を使用 
  }).toThrow(/readCapacity must be greater than 5 and less than 20/)
});
```
