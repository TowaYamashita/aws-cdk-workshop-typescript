#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { WorkShopPipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();
new WorkShopPipelineStack(app, 'CdkWorkshopPipelineStack');
