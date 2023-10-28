import {
  LambdaIntegration,
  MethodLoggingLevel,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Function, Runtime, AssetCode } from "aws-cdk-lib/aws-lambda";
import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

interface LambdaApiStackProps extends StackProps {
  functionName: string;
  functionEnabledActions: string[];
}

export class LambdaApiStack extends Stack {
  private restApi: RestApi;
  private lambdaFunction: Function;

  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {LambdaApiStackProps} props
   */
  constructor(scope: Construct, id: string, props: LambdaApiStackProps) {
    super(scope, id, props);

    // ========================================
    // API Gateway REST API
    // ========================================
    this.restApi = new RestApi(this, this.stackName + "RestApi", {
      deployOptions: {
        stageName: "beta",
        metricsEnabled: true,
        loggingLevel: MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
    });

    // ========================================
    // Execution Role for Lambda Function
    // ========================================
    const lambdaExecRole = new Role(
      this,
      this.stackName + "LambdaExecutionRole",
      {
        assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      }
    );
    lambdaExecRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [...props.functionEnabledActions],
        resources: ["*"],
      })
    );

    // ========================================
    // Lambda Function
    // ========================================
    this.lambdaFunction = new Function(this, props.functionName, {
      functionName: props.functionName,
      handler: "index.handler",
      runtime: Runtime.NODEJS_18_X,
      code: AssetCode.fromAsset("lambda"),
      memorySize: 512,
      timeout: Duration.seconds(10),
      environment: {
        AWS_REGION: this.region,
      },
      role: lambdaExecRole,
    });

    // ========================================
    // API Gateway {contact} Resource
    // ========================================
    const contact = this.restApi.root.addResource("contact");
    contact.addMethod("POST", new LambdaIntegration(this.lambdaFunction, {}));
  }
}
