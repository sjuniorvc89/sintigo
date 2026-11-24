import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure the AWS Amplify Auth resource (Cognito)
 * Supports email login, guest access and custom user attributes.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    preferredUsername: {
      mutable: true,
      required: false,
    },
  },
});
