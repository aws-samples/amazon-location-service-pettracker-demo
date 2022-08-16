import {
  CfnOutput,
  Duration,
  Expiration,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import {
  StateMachine,
  Pass,
  Result,
  Choice,
  Condition,
  Wait,
} from "aws-cdk-lib/aws-stepfunctions";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Construct } from "constructs";

interface StepFnsConstructProps extends StackProps {
  iotSimulatorFn: Function;
}

export class StepFns extends Construct {
  constructor(scope: Construct, id: string, props: StepFnsConstructProps) {
    super(scope, id);

    const { iotSimulatorFn } = props;

    const testFn = new Function(this, "testFn", {
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromInline(`
      exports.handler = function iterator (event, context, callback) {
        let index = event.iterator.index
        let step = event.iterator.step
        let count = event.iterator.count
       
        index = index + step
       
        callback(null, {
          index,
          step,
          count,
          continue: index < count
        })
      }
      `),
      handler: "index.handler",
      timeout: Duration.seconds(30),
      logRetention: RetentionDays.ONE_DAY,
    });

    const simulateStepTask = new LambdaInvoke(this, "Iterator", {
      lambdaFunction: iotSimulatorFn,
      resultPath: "$.iterator",
      payloadResponseOnly: true,
    });

    const definition = new Pass(this, "Configure", {
      result: Result.fromObject({
        count: 10,
        index: 0,
        step: 1,
      }),
      resultPath: "$.iterator",
    })
      .next(simulateStepTask)
      .next(
        new Choice(this, "IsCountReached")
          .when(
            Condition.booleanEquals("$.iterator.continue", true),
            new Pass(this, "ExampleWork", {
              result: Result.fromObject({
                success: true,
              }),
              resultPath: "$.result",
            }).next(simulateStepTask)
          )
          .otherwise(new Pass(this, "Done", {}))
      );

    new StateMachine(this, "PetSimulator", {
      definition,
      timeout: Duration.minutes(30),
    });
  }
}
