import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

/**
 * AWS Amplify Gen 2 Backend configuration for MigoLab
 * Automatically provisions DynamoDB tables, AppSync GraphQL API, and Cognito Auth.
 */
export const backend = defineBackend({
  auth,
  data,
});
