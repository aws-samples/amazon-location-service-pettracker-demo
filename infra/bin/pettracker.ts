#!/usr/bin/env node
import "source-map-support/register";
import { App, Aspects } from "aws-cdk-lib";
import { PetTracker } from "../lib/pettracker-stack.js";
import { AwsSolutionsChecks } from "cdk-nag";

const app = new App();
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
new PetTracker(app, "PetTracker", {});
