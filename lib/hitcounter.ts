import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface HitCounterProps {
  downstream: lambda.IFunction;
  
  /**
   * The read capacity units for the table
   *
   * Must be greater than 5 and lower than 20
   *
   * @default 5
   */
  readCapacity?: number;
}

export class HitCounter extends Construct {
  public readonly handler: lambda.Function;
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: HitCounterProps) {
    // readCapacity の値が有効な範囲内か検証
    if(props.readCapacity !== undefined && (props.readCapacity < 5 || props.readCapacity > 20)){
      throw new Error('readCapacity must be greater than 5 and less than 20');
    }

    super(scope, id);

    const table = new dynamodb.Table(this, 'Hits', {
        partitionKey: { name: 'path', type: dynamodb.AttributeType.STRING },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        readCapacity: props.readCapacity ?? 5,
    });
    this.table = table;

    this.handler = new lambda.Function(this, 'HitCounterHandler', {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'hitcounter.handler',
        code: lambda.Code.fromAsset('lambda'),
        environment: {
            DOWNSTREAM_FUNCTION_NAME: props.downstream.functionName,
            HITS_TABLE_NAME: table.tableName
        }
    });

    // DynamoDB の読み書きができる権限を付与
    table.grantReadWriteData(this.handler);

    // ダウンストリームのLambda関数を呼び出す権限を付与
    props.downstream.grantInvoke(this.handler);
  }
}
