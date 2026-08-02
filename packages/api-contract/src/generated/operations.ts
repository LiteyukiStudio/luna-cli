// Generated from openapi/openapi.yaml. Do not edit manually.
import type { OpenApiOperationSnapshot, OpenApiSnapshotMetadata } from "../types.js";

export const OPENAPI_SNAPSHOT_METADATA = {
  "source": "openapi/openapi.yaml",
  "openapiVersion": "3.1.0",
  "apiVersion": "0.1.0",
  "sourceDigest": "sha256:2c076d1ed60af35e79725be6ba7d871d5f0a47f27b65696e566c62d6c5d106d1",
  "operationCount": 259
} as const satisfies OpenApiSnapshotMetadata;

export const OPENAPI_OPERATION_SNAPSHOTS = [
  {
    "method": "get",
    "path": "/healthz",
    "tags": [
      "Health"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Service is healthy."
      }
    ],
    "summary": "Health check",
    "operationId": "healthCheck"
  },
  {
    "method": "get",
    "path": "/api/v1/meta",
    "tags": [
      "Health"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [],
        "description": "Public API compatibility and feature metadata."
      }
    ],
    "summary": "Get API version and CLI capability metadata",
    "operationId": "getApiMeta"
  },
  {
    "method": "get",
    "path": "/.well-known/oauth-authorization-server",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [],
        "description": "OAuth 2.0 authorization server metadata."
      }
    ],
    "summary": "Get OAuth authorization server metadata",
    "operationId": "getOAuthAuthorizationServerMetadata",
    "xLunaCli": {
      "classification": "protocol-adapter",
      "hidden": true,
      "exclusionReason": "OAuth discovery is consumed by the CLI authentication adapter."
    }
  },
  {
    "method": "post",
    "path": "/api/v1/oauth/device/authorization",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [],
        "description": "Device and user codes for the browser verification flow."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/OAuthProtocolError"
        ],
        "description": "OAuth protocol error."
      }
    ],
    "summary": "Start an OAuth Device Authorization Grant",
    "operationId": "startOAuthDeviceAuthorization",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/x-www-form-urlencoded"
      ],
      "schemaRefs": []
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "type": "object",
          "required": [
            "client_id"
          ],
          "properties": {
            "client_id": {
              "type": "string"
            },
            "scope": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "classification": "protocol-adapter",
      "hidden": true,
      "exclusionReason": "Device authorization is exposed through `luna login`."
    }
  },
  {
    "method": "get",
    "path": "/api/v1/oauth/device/verification",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "user_code",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/OAuthApplication"
        ],
        "description": "Pending device authorization visible to the signed-in user."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Invalid, expired, or consumed user code."
      }
    ],
    "summary": "Inspect a pending OAuth device authorization",
    "operationId": "getOAuthDeviceVerification",
    "inputSchema": {
      "type": "object",
      "properties": {
        "user_code": {
          "type": "string"
        }
      },
      "required": [
        "user_code"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "classification": "protocol-adapter",
      "hidden": true,
      "exclusionReason": "Browser-only Device Code verification endpoint."
    }
  },
  {
    "method": "post",
    "path": "/api/v1/oauth/device/verification",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [],
        "description": "Device authorization decision accepted."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Invalid, expired, or consumed user code."
      }
    ],
    "summary": "Approve or deny an OAuth device authorization",
    "operationId": "decideOAuthDeviceVerification",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": []
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "type": "object",
          "required": [
            "decision",
            "userCode"
          ],
          "properties": {
            "decision": {
              "type": "string",
              "enum": [
                "approve",
                "deny"
              ]
            },
            "userCode": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "classification": "protocol-adapter",
      "hidden": true,
      "exclusionReason": "Browser-only Device Code verification endpoint."
    }
  },
  {
    "method": "post",
    "path": "/api/v1/oauth/token",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/OAuthTokenResponse"
        ],
        "description": "OAuth access and refresh tokens."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/OAuthProtocolError"
        ],
        "description": "OAuth protocol error."
      }
    ],
    "summary": "Exchange an OAuth authorization grant for tokens",
    "operationId": "exchangeOAuthToken",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/x-www-form-urlencoded"
      ],
      "schemaRefs": []
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "type": "object",
          "required": [
            "grant_type"
          ],
          "properties": {
            "client_id": {
              "type": "string"
            },
            "client_secret": {
              "type": "string",
              "writeOnly": true
            },
            "code": {
              "type": "string"
            },
            "code_verifier": {
              "type": "string"
            },
            "device_code": {
              "type": "string",
              "writeOnly": true
            },
            "grant_type": {
              "type": "string",
              "enum": [
                "authorization_code",
                "refresh_token",
                "urn:ietf:params:oauth:grant-type:device_code"
              ]
            },
            "redirect_uri": {
              "type": "string",
              "format": "uri"
            },
            "refresh_token": {
              "type": "string",
              "writeOnly": true
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "classification": "protocol-adapter",
      "hidden": true,
      "exclusionReason": "OAuth token exchange is consumed by the CLI authentication adapter."
    }
  },
  {
    "method": "post",
    "path": "/api/v1/oauth/revoke",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Token is revoked or was already invalid."
      }
    ],
    "summary": "Revoke an OAuth access or refresh token",
    "operationId": "revokeOAuthToken",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/x-www-form-urlencoded"
      ],
      "schemaRefs": []
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "type": "object",
          "required": [
            "token"
          ],
          "properties": {
            "client_id": {
              "type": "string"
            },
            "client_secret": {
              "type": "string",
              "writeOnly": true
            },
            "token": {
              "type": "string",
              "writeOnly": true
            },
            "token_type_hint": {
              "type": "string",
              "enum": [
                "access_token",
                "refresh_token"
              ]
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "classification": "protocol-adapter",
      "hidden": true,
      "exclusionReason": "OAuth revocation is exposed through `luna logout`."
    }
  },
  {
    "method": "post",
    "path": "/api/v1/public/configs",
    "tags": [
      "Configs"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Public config dictionary."
      }
    ],
    "summary": "Get public app configs by keys",
    "operationId": "getPublicConfigs",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/ConfigKeysInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/ConfigKeysInput",
          "type": "object",
          "required": [
            "keys"
          ],
          "properties": {
            "keys": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/build/templates",
    "tags": [
      "Builds"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BuildTemplate"
        ],
        "description": "Built-in template catalog."
      }
    ],
    "summary": "List immutable platform build templates",
    "operationId": "listBuildTemplates"
  },
  {
    "method": "post",
    "path": "/api/v1/build/templates/{templateId}/preview",
    "tags": [
      "Builds"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "templateId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BuildTemplatePreview"
        ],
        "description": "Rendered, immutable build definition preview."
      }
    ],
    "summary": "Validate template parameters and preview the generated Dockerfile",
    "operationId": "previewBuildTemplate",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/BuildTemplatePreviewInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "templateId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/BuildTemplatePreviewInput",
          "type": "object",
          "required": [
            "values"
          ],
          "properties": {
            "values": {
              "type": "object",
              "additionalProperties": {
                "type": "string"
              }
            },
            "version": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body",
        "templateId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/build/environment-config",
    "tags": [
      "Builds"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "scope",
        "in": "query",
        "required": true,
        "ref": "#/components/parameters/BuildEnvironmentScope",
        "schema": {
          "type": "string",
          "enum": [
            "global",
            "application",
            "deployment"
          ]
        }
      },
      {
        "name": "projectId",
        "in": "query",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "applicationId",
        "in": "query",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "deploymentTargetId",
        "in": "query",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BuildEnvironmentConfig"
        ],
        "description": "Public values and boolean secret presence. Secret values and references are never returned."
      }
    ],
    "summary": "Get one global, application, or deployment build environment",
    "operationId": "getBuildEnvironmentConfig",
    "inputSchema": {
      "type": "object",
      "properties": {
        "scope": {
          "type": "string",
          "enum": [
            "global",
            "application",
            "deployment"
          ]
        },
        "projectId": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        },
        "deploymentTargetId": {
          "type": "string"
        }
      },
      "required": [
        "scope"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/build/environment-config",
    "tags": [
      "Builds"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "scope",
        "in": "query",
        "required": true,
        "ref": "#/components/parameters/BuildEnvironmentScope",
        "schema": {
          "type": "string",
          "enum": [
            "global",
            "application",
            "deployment"
          ]
        }
      },
      {
        "name": "projectId",
        "in": "query",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "applicationId",
        "in": "query",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "deploymentTargetId",
        "in": "query",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BuildEnvironmentConfig"
        ],
        "description": "Updated build environment with secret presence only."
      }
    ],
    "summary": "Replace one global, application, or deployment build environment",
    "operationId": "updateBuildEnvironmentConfig",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/BuildEnvironmentConfigInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "scope": {
          "type": "string",
          "enum": [
            "global",
            "application",
            "deployment"
          ]
        },
        "projectId": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        },
        "deploymentTargetId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/BuildEnvironmentConfigInput",
          "type": "object",
          "required": [
            "secrets",
            "variables"
          ],
          "properties": {
            "secrets": {
              "type": "object",
              "description": "Existing keys may use an empty value to retain their encrypted value. Omitted keys are removed.",
              "writeOnly": true,
              "additionalProperties": {
                "type": "string"
              }
            },
            "variables": {
              "type": "object",
              "additionalProperties": {
                "type": "string"
              }
            }
          }
        }
      },
      "required": [
        "body",
        "scope"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/auth/bootstrap",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BootstrapStatus"
        ],
        "description": "Bootstrap status. devLoginHint is returned only in development mode."
      }
    ],
    "summary": "Get bootstrap and runtime mode status",
    "operationId": "getBootstrapStatus"
  },
  {
    "method": "post",
    "path": "/api/v1/auth/bootstrap/admin",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AuthSessionResponse"
        ],
        "description": "Created platform admin and session."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Invalid email, password, language, or JSON (`bootstrap.invalid_input` or `request.invalid_json`)."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The production bootstrap token is invalid (`bootstrap.token_invalid`)."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Platform admin already exists."
      },
      {
        "status": "503",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Production bootstrap is unavailable because `BOOTSTRAP_TOKEN` is not configured (`bootstrap.unavailable`)."
      }
    ],
    "summary": "Initialize the first platform admin",
    "operationId": "initializeAdmin",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/InitializeAdminInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/InitializeAdminInput",
          "type": "object",
          "required": [
            "email",
            "password"
          ],
          "properties": {
            "bootstrapToken": {
              "type": "string",
              "description": "Required when `mode` is `production`; must exactly match the API process `BOOTSTRAP_TOKEN`. Ignored in development.",
              "writeOnly": true
            },
            "email": {
              "type": "string",
              "format": "email"
            },
            "language": {
              "type": "string",
              "enum": [
                "zh-CN",
                "en-US"
              ]
            },
            "name": {
              "type": "string"
            },
            "password": {
              "type": "string",
              "minLength": 8
            },
            "rememberMe": {
              "type": "boolean",
              "description": "When true, also creates a rotating, per-user 30-day HttpOnly remember cookie. The regular session remains valid for 24 hours.",
              "default": false
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/auth/login",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AuthSessionResponse"
        ],
        "description": "Login succeeded."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Login failed."
      }
    ],
    "summary": "Login with a local account",
    "operationId": "login",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/LoginInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/LoginInput",
          "type": "object",
          "required": [
            "email",
            "password"
          ],
          "properties": {
            "email": {
              "type": "string",
              "format": "email"
            },
            "password": {
              "type": "string"
            },
            "rememberMe": {
              "type": "boolean",
              "description": "When true, also creates a rotating, per-user 30-day HttpOnly remember cookie. The regular session remains valid for 24 hours.",
              "default": false
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/auth/login/resume",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AuthSessionResponse"
        ],
        "description": "Remembered login resumed."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Remember token missing, expired, revoked, or the account is disabled."
      }
    ],
    "summary": "Resume login with a remembered account",
    "description": "Rotates the per-user remember token, creates a new 24-hour session, and refreshes the 30-day remember cookie. Browser cookies are required.",
    "operationId": "resumeLogin",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/ResumeLoginInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/ResumeLoginInput",
          "type": "object",
          "required": [
            "userId"
          ],
          "properties": {
            "userId": {
              "type": "string",
              "description": "User selected from locally stored recent-account display metadata; authentication still requires that user's HttpOnly remember cookie."
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/auth/logout",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Logged out."
      }
    ],
    "summary": "Logout current session",
    "operationId": "logout"
  },
  {
    "method": "get",
    "path": "/api/v1/auth/registration",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AuthRegistrationStatus"
        ],
        "description": "Public registration capability flags."
      }
    ],
    "summary": "Get public registration capabilities",
    "operationId": "getAuthRegistrationStatus"
  },
  {
    "method": "post",
    "path": "/api/v1/auth/registration/email/code",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "202",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Verification challenge created."
      }
    ],
    "summary": "Request an email registration verification code",
    "operationId": "requestEmailRegistrationCode",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/EmailRegistrationCodeInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/EmailRegistrationCodeInput",
          "type": "object",
          "required": [
            "email"
          ],
          "properties": {
            "email": {
              "type": "string",
              "format": "email"
            },
            "language": {
              "type": "string",
              "enum": [
                "zh-CN",
                "en-US"
              ]
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/auth/registration/email",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Account created and signed in."
      }
    ],
    "summary": "Complete email registration",
    "operationId": "completeEmailRegistration",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/EmailRegistrationInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/EmailRegistrationInput",
          "type": "object",
          "required": [
            "challengeId",
            "code",
            "email",
            "name",
            "password"
          ],
          "properties": {
            "challengeId": {
              "type": "string"
            },
            "code": {
              "type": "string",
              "minLength": 6,
              "maxLength": 6
            },
            "email": {
              "type": "string",
              "format": "email"
            },
            "language": {
              "type": "string",
              "enum": [
                "zh-CN",
                "en-US"
              ]
            },
            "name": {
              "type": "string"
            },
            "password": {
              "type": "string",
              "writeOnly": true,
              "minLength": 8
            },
            "rememberMe": {
              "type": "boolean"
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/auth/registration/settings",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AuthRegistrationSettings"
        ],
        "description": "Registration settings with the write-only SMTP password omitted."
      }
    ],
    "summary": "Get registration and SMTP settings",
    "operationId": "getAuthRegistrationSettings"
  },
  {
    "method": "put",
    "path": "/api/v1/auth/registration/settings",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Registration settings updated."
      }
    ],
    "summary": "Update registration and SMTP settings",
    "operationId": "updateAuthRegistrationSettings",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/AuthRegistrationSettingsInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/AuthRegistrationSettingsInput",
          "type": "object",
          "required": [
            "allowEmailRegistration",
            "allowExternalIdentityPassword",
            "allowOidcRegistration",
            "smtpFromAddress",
            "smtpFromName",
            "smtpHost",
            "smtpPort",
            "smtpSecurity",
            "smtpUsername"
          ],
          "properties": {
            "allowEmailRegistration": {
              "type": "boolean"
            },
            "allowExternalIdentityPassword": {
              "type": "boolean"
            },
            "allowOidcRegistration": {
              "type": "boolean"
            },
            "smtpFromAddress": {
              "type": "string",
              "format": "email"
            },
            "smtpFromName": {
              "type": "string"
            },
            "smtpHost": {
              "type": "string"
            },
            "smtpPassword": {
              "type": "string",
              "description": "Leave empty to keep the existing Secret Store value.",
              "writeOnly": true
            },
            "smtpPort": {
              "type": "integer",
              "minimum": 1,
              "maximum": 65535
            },
            "smtpSecurity": {
              "type": "string",
              "enum": [
                "none",
                "starttls",
                "tls"
              ]
            },
            "smtpUsername": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/auth/mfa/status",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/MFAStatus"
        ],
        "description": "Current enrollment, policy, and recovery-code status."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Browser session is missing or invalid (`mfa.session_required` or an authentication error)."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Personal access tokens cannot access MFA session endpoints (`mfa.session_required`)."
      },
      {
        "status": "500",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "MFA status could not be loaded."
      }
    ],
    "summary": "Get current user's MFA status",
    "description": "Requires an interactive browser session. Personal access tokens cannot manage or verify MFA.",
    "operationId": "getMFAStatus"
  },
  {
    "method": "post",
    "path": "/api/v1/auth/mfa/totp/enroll",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/MFAEnrollment"
        ],
        "description": "Pending TOTP enrollment created."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Browser session is missing or invalid, or primary reauthentication is required (`mfa.reauth_required`)."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Personal access tokens cannot enroll MFA (`mfa.session_required`)."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "MFA is already enabled (`mfa.already_enabled`)."
      },
      {
        "status": "429",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Enrollment attempts exceeded the user or IP rate limit (`mfa.rate_limited`)."
      },
      {
        "status": "500",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The TOTP secret could not be stored (`mfa.secret_store_failed`) or enrollment persistence failed."
      },
      {
        "status": "503",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "MFA rate limiting is unavailable in production (`mfa.rate_limit_unavailable`)."
      }
    ],
    "summary": "Start TOTP enrollment",
    "description": "Replaces any pending enrollment, stores the TOTP secret in the encrypted secret store, and returns the secret only for the current enrollment flow. Local accounts must re-enter their current password. OIDC accounts require non-impersonated primary authentication within the last five minutes; remember-token recovery does not refresh that timestamp.",
    "operationId": "enrollMFA",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/MFAEnrollmentInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/MFAEnrollmentInput",
          "type": "object",
          "properties": {
            "currentPassword": {
              "type": "string",
              "format": "password",
              "description": "Required for local accounts and ignored for OIDC accounts.",
              "writeOnly": true
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/auth/mfa/totp/confirm",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/MFAConfirmResult"
        ],
        "description": "MFA enabled and recovery codes generated."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Invalid request body (`request.invalid_json`)."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Browser session is invalid or the TOTP code is invalid (`mfa.invalid_code`)."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Personal access tokens cannot confirm MFA (`mfa.session_required`)."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Enrollment is missing, changed, or already enabled (`mfa.enrollment_required`, `mfa.enrollment_changed`, or `mfa.already_enabled`)."
      },
      {
        "status": "429",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Confirmation attempts exceeded the user or IP rate limit (`mfa.rate_limited`)."
      },
      {
        "status": "500",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Recovery codes or enrollment state could not be persisted."
      },
      {
        "status": "503",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "MFA rate limiting is unavailable in production (`mfa.rate_limit_unavailable`)."
      }
    ],
    "summary": "Confirm pending TOTP enrollment",
    "description": "Accepts the current or adjacent 30-second TOTP window. On success, enables MFA and returns ten one-time recovery codes that are shown only once.",
    "operationId": "confirmMFA",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/MFAConfirmInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/MFAConfirmInput",
          "type": "object",
          "required": [
            "code"
          ],
          "properties": {
            "code": {
              "type": "string",
              "pattern": "^[0-9]{6}$"
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/auth/mfa/verify",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/MFAVerifyResult"
        ],
        "description": "Step-up assertion created."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Unsupported purpose or both/neither credentials were supplied (`mfa.invalid_purpose` or `mfa.credential_required`)."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Browser session or MFA credential is invalid (`mfa.invalid_code`)."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Personal access tokens cannot create MFA assertions (`mfa.session_required`)."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "MFA is not enabled for the current user (`mfa.not_enabled`)."
      },
      {
        "status": "429",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Verification attempts exceeded the user or IP rate limit (`mfa.rate_limited`)."
      },
      {
        "status": "500",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The Step-up assertion could not be persisted."
      },
      {
        "status": "503",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "MFA rate limiting is unavailable in production (`mfa.rate_limit_unavailable`)."
      }
    ],
    "summary": "Verify MFA for a sensitive-operation purpose",
    "description": "Accepts exactly one TOTP code or one recovery code. A successful recovery code is consumed atomically. The resulting assertion is bound to the current user, browser session, and purpose.",
    "operationId": "verifyMFA",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/MFAVerifyInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/MFAVerifyInput",
          "type": "object",
          "required": [
            "purpose"
          ],
          "properties": {
            "code": {
              "type": "string",
              "pattern": "^[0-9]{6}$"
            },
            "purpose": {
              "ref": "#/components/schemas/MFAPurpose",
              "type": "string",
              "enum": [
                "runtime_exec",
                "runtime_terminal",
                "data_export",
                "secret_update",
                "registry_credential_update",
                "kubeconfig_update",
                "auth_provider_update",
                "user_admin_update",
                "mfa_manage",
                "security_settings_update",
                "data_retention_cleanup",
                "password_update",
                "access_token_manage"
              ]
            },
            "recoveryCode": {
              "type": "string",
              "description": "One-time recovery code. Hyphens and case are normalized before verification."
            }
          },
          "oneOf": [
            {
              "required": [
                "code"
              ],
              "not": {
                "required": [
                  "recoveryCode"
                ]
              }
            },
            {
              "required": [
                "recoveryCode"
              ],
              "not": {
                "required": [
                  "code"
                ]
              }
            }
          ]
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/auth/mfa/recovery-codes",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/MFARecoveryCodes"
        ],
        "description": "Recovery codes replaced."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Browser session is missing or invalid."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "MFA management assertion is missing or expired (`mfa_required`), or a personal access token was used (`mfa.session_required`)."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "MFA is not enabled (`mfa.not_enabled`)."
      },
      {
        "status": "500",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Recovery codes could not be generated or persisted."
      }
    ],
    "summary": "Regenerate MFA recovery codes",
    "description": "Requires a valid `mfa_manage` assertion. Replaces and invalidates all previous recovery codes; the new plaintext codes are returned only once.",
    "operationId": "regenerateMFARecoveryCodes"
  },
  {
    "method": "delete",
    "path": "/api/v1/auth/mfa",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "MFA disabled and assertions revoked."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Browser session is missing or invalid."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "MFA management assertion is missing or expired (`mfa_required`), or a personal access token was used (`mfa.session_required`)."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The global policy requires another MFA-enabled platform administrator (`mfa.last_admin_required`)."
      },
      {
        "status": "500",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "MFA state or encrypted secret data could not be deleted."
      }
    ],
    "summary": "Disable current user's MFA",
    "description": "Requires a valid `mfa_manage` assertion. Deletes the TOTP secret, recovery codes, and all current step-up assertions. While the global policy is enabled, the last MFA-enabled platform administrator cannot disable MFA.",
    "operationId": "disableMFA"
  },
  {
    "method": "get",
    "path": "/api/v1/auth/providers",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Auth provider list."
      }
    ],
    "summary": "List auth providers",
    "operationId": "listAuthProviders"
  },
  {
    "method": "post",
    "path": "/api/v1/auth/providers",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Created auth provider."
      }
    ],
    "summary": "Create auth provider",
    "operationId": "createAuthProvider",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/AuthProviderInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/AuthProviderInput",
          "type": "object",
          "required": [
            "clientId",
            "issuerUrl",
            "name"
          ],
          "properties": {
            "clientId": {
              "type": "string"
            },
            "clientSecret": {
              "type": "string"
            },
            "emailClaim": {
              "type": "string"
            },
            "enabled": {
              "type": "boolean"
            },
            "groupClaim": {
              "type": "string"
            },
            "isDefault": {
              "type": "boolean"
            },
            "issuerUrl": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "scopes": {
              "type": "string"
            },
            "type": {
              "type": "string",
              "enum": [
                "oidc"
              ]
            },
            "usernameClaim": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/auth/providers/{providerId}",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "providerId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProviderId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Updated auth provider."
      }
    ],
    "summary": "Update auth provider",
    "operationId": "updateAuthProvider",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/AuthProviderInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "providerId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/AuthProviderInput",
          "type": "object",
          "required": [
            "clientId",
            "issuerUrl",
            "name"
          ],
          "properties": {
            "clientId": {
              "type": "string"
            },
            "clientSecret": {
              "type": "string"
            },
            "emailClaim": {
              "type": "string"
            },
            "enabled": {
              "type": "boolean"
            },
            "groupClaim": {
              "type": "string"
            },
            "isDefault": {
              "type": "boolean"
            },
            "issuerUrl": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "scopes": {
              "type": "string"
            },
            "type": {
              "type": "string",
              "enum": [
                "oidc"
              ]
            },
            "usernameClaim": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body",
        "providerId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/auth/admission-policy",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Auth admission policy."
      }
    ],
    "summary": "Get auth admission policy",
    "operationId": "getAuthAdmissionPolicy"
  },
  {
    "method": "put",
    "path": "/api/v1/auth/admission-policy",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Updated auth admission policy."
      }
    ],
    "summary": "Update auth admission policy",
    "operationId": "updateAuthAdmissionPolicy",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/AuthAdmissionPolicyInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/AuthAdmissionPolicyInput",
          "type": "object",
          "properties": {
            "allowedEmailDomains": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "allowedOidcGroups": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "allowLocalLogin": {
              "type": "boolean"
            },
            "allowOidcLogin": {
              "type": "boolean"
            },
            "defaultRole": {
              "ref": "#/components/schemas/PlatformRole",
              "type": "string",
              "enum": [
                "platform_admin",
                "user"
              ]
            },
            "invitedEmails": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/auth/oidc/{providerId}/start",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "providerId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProviderId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "mode",
        "in": "query",
        "schema": {
          "type": "string",
          "enum": [
            "login",
            "bind"
          ],
          "default": "login"
        }
      },
      {
        "name": "redirect",
        "in": "query",
        "schema": {
          "type": "string",
          "default": "/projects"
        }
      }
    ],
    "responses": [
      {
        "status": "302",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Redirect to OIDC provider."
      }
    ],
    "summary": "Start OIDC login or binding flow",
    "operationId": "startOIDC",
    "inputSchema": {
      "type": "object",
      "properties": {
        "providerId": {
          "type": "string"
        },
        "mode": {
          "type": "string",
          "enum": [
            "login",
            "bind"
          ],
          "default": "login"
        },
        "redirect": {
          "type": "string",
          "default": "/projects"
        }
      },
      "required": [
        "providerId"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "hidden": true,
      "exclusionReason": "Protocol endpoint consumed by a browser, webhook, probe, stream, or terminal adapter instead of a regular CLI command."
    }
  },
  {
    "method": "get",
    "path": "/api/v1/auth/oidc/callback",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "state",
        "in": "query",
        "required": true,
        "ref": "#/components/parameters/OAuthState",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "code",
        "in": "query",
        "required": true,
        "ref": "#/components/parameters/OAuthCode",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "302",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Redirect after OIDC callback."
      }
    ],
    "summary": "Complete OIDC callback",
    "operationId": "completeOIDC",
    "inputSchema": {
      "type": "object",
      "properties": {
        "state": {
          "type": "string"
        },
        "code": {
          "type": "string"
        }
      },
      "required": [
        "code",
        "state"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "hidden": true,
      "exclusionReason": "Protocol endpoint consumed by a browser, webhook, probe, stream, or terminal adapter instead of a regular CLI command."
    }
  },
  {
    "method": "get",
    "path": "/api/v1/users/me",
    "tags": [
      "Users"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/CurrentUser"
        ],
        "description": "Current user."
      }
    ],
    "summary": "Get current user",
    "operationId": "getCurrentUser"
  },
  {
    "method": "put",
    "path": "/api/v1/users/me",
    "tags": [
      "Users"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/CurrentUser"
        ],
        "description": "Updated current user."
      }
    ],
    "summary": "Update current user preferences",
    "operationId": "updateCurrentUser",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/UpdateCurrentUserInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/UpdateCurrentUserInput",
          "type": "object",
          "properties": {
            "avatarUrl": {
              "type": "string"
            },
            "brandColorPreset": {
              "type": "string",
              "description": "Empty follows the platform color theme; otherwise stores a curated multi-color theme or official Radix single-color preset ID.",
              "enum": [
                "",
                "gold",
                "bronze",
                "brown",
                "yellow",
                "amber",
                "orange",
                "tomato",
                "red",
                "ruby",
                "crimson",
                "pink",
                "plum",
                "purple",
                "violet",
                "iris",
                "indigo",
                "blue",
                "cyan",
                "teal",
                "jade",
                "green",
                "grass",
                "lime",
                "mint",
                "sky"
              ]
            },
            "interfaceStyle": {
              "type": "string",
              "description": "Empty follows the platform default; otherwise overrides the interface style.",
              "enum": [
                "",
                "minimal",
                "themed"
              ]
            },
            "language": {
              "type": "string",
              "enum": [
                "zh-CN",
                "en-US"
              ]
            },
            "name": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/users/me/password",
    "tags": [
      "Users"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Password updated and all sessions revoked."
      }
    ],
    "summary": "Set or change the current user's local password",
    "operationId": "updateMyPassword",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/UpdateMyPasswordInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/UpdateMyPasswordInput",
          "type": "object",
          "required": [
            "newPassword"
          ],
          "properties": {
            "currentPassword": {
              "type": "string",
              "writeOnly": true
            },
            "newPassword": {
              "type": "string",
              "writeOnly": true,
              "minLength": 8
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/users/me/external-identities",
    "tags": [
      "Users"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "External identity list."
      }
    ],
    "summary": "List current user's external identities",
    "operationId": "listMyExternalIdentities"
  },
  {
    "method": "delete",
    "path": "/api/v1/users/me/external-identities/{identityId}",
    "tags": [
      "Users"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "identityId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/IdentityId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "External identity unbound."
      }
    ],
    "summary": "Unbind current user's external identity",
    "operationId": "unbindMyExternalIdentity",
    "inputSchema": {
      "type": "object",
      "properties": {
        "identityId": {
          "type": "string"
        }
      },
      "required": [
        "identityId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/users",
    "tags": [
      "Users"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "ref": "#/components/parameters/Page",
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "ref": "#/components/parameters/PageSize",
        "schema": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        }
      },
      {
        "name": "sortBy",
        "in": "query",
        "schema": {
          "type": "string",
          "enum": [
            "createdAt",
            "email",
            "name",
            "role",
            "passwordSet",
            "status"
          ],
          "default": "createdAt"
        }
      },
      {
        "name": "sortOrder",
        "in": "query",
        "ref": "#/components/parameters/SortOrder",
        "schema": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "default": "desc"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Paginated user list."
      }
    ],
    "summary": "List users",
    "operationId": "listUsers",
    "inputSchema": {
      "type": "object",
      "properties": {
        "page": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        },
        "pageSize": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        },
        "sortBy": {
          "type": "string",
          "enum": [
            "createdAt",
            "email",
            "name",
            "role",
            "passwordSet",
            "status"
          ],
          "default": "createdAt"
        },
        "sortOrder": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "default": "desc"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/users",
    "tags": [
      "Users"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Created user."
      }
    ],
    "summary": "Create local user",
    "operationId": "createUser",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/UserInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/UserInput",
          "type": "object",
          "required": [
            "email",
            "name"
          ],
          "properties": {
            "disabled": {
              "type": "boolean"
            },
            "email": {
              "type": "string"
            },
            "language": {
              "type": "string",
              "enum": [
                "zh-CN",
                "en-US"
              ]
            },
            "name": {
              "type": "string"
            },
            "password": {
              "type": "string"
            },
            "role": {
              "ref": "#/components/schemas/PlatformRole",
              "type": "string",
              "enum": [
                "platform_admin",
                "user"
              ]
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/users/{userId}",
    "tags": [
      "Users"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "userId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/UserId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Updated user."
      }
    ],
    "summary": "Update user",
    "operationId": "updateUser",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/UserInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "userId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/UserInput",
          "type": "object",
          "required": [
            "email",
            "name"
          ],
          "properties": {
            "disabled": {
              "type": "boolean"
            },
            "email": {
              "type": "string"
            },
            "language": {
              "type": "string",
              "enum": [
                "zh-CN",
                "en-US"
              ]
            },
            "name": {
              "type": "string"
            },
            "password": {
              "type": "string"
            },
            "role": {
              "ref": "#/components/schemas/PlatformRole",
              "type": "string",
              "enum": [
                "platform_admin",
                "user"
              ]
            }
          }
        }
      },
      "required": [
        "body",
        "userId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/users/{userId}/mfa",
    "tags": [
      "Users"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [
      {
        "name": "userId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/UserId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Target MFA state reset."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Interactive browser session is missing or invalid."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Platform-administrator role or `user_admin_update` Step-up verification is required."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Target user or MFA enrollment was not found (`mfa.reset_target_not_found`)."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Self-reset is forbidden (`mfa.admin_reset_self_forbidden`) or the target is the last MFA-enabled platform administrator (`mfa.last_admin_required`)."
      }
    ],
    "summary": "Reset another user's MFA enrollment",
    "description": "Requires an interactive platform-administrator session and an active `user_admin_update` Step-up assertion. Deletes the target user's authenticator secret, recovery codes, and active Step-up assertions. Administrators cannot reset their own MFA through this endpoint and cannot remove the last enabled administrator MFA while the global policy is active.",
    "operationId": "adminResetUserMFA",
    "inputSchema": {
      "type": "object",
      "properties": {
        "userId": {
          "type": "string"
        }
      },
      "required": [
        "userId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/configs/definitions",
    "tags": [
      "Configs"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ConfigDefinition"
        ],
        "description": "Config definitions."
      }
    ],
    "summary": "List configurable app config definitions",
    "operationId": "listConfigDefinitions"
  },
  {
    "method": "get",
    "path": "/api/v1/configs",
    "tags": [
      "Configs"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ServiceBindingCheckResult"
        ],
        "description": "Point-in-time service dependency observation."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Get Configs",
    "operationId": "getConfigs"
  },
  {
    "method": "put",
    "path": "/api/v1/configs",
    "tags": [
      "Configs"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Updated config dictionary."
      }
    ],
    "summary": "Update app configs",
    "operationId": "updateConfigs",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/UpdateConfigsInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/UpdateConfigsInput",
          "type": "object",
          "required": [
            "values"
          ],
          "properties": {
            "values": {
              "type": "object",
              "additionalProperties": {
                "oneOf": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "number"
                  },
                  {
                    "type": "boolean"
                  },
                  {
                    "type": "object"
                  },
                  {
                    "type": "array"
                  }
                ]
              }
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/data-retention/catalog",
    "tags": [
      "DataRetention"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/DataRetentionCatalogResponse"
        ],
        "description": "Retention dataset catalog."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Platform-administrator role is required."
      }
    ],
    "summary": "List supported data-retention datasets",
    "description": "Returns the fixed cleanup catalog. Audit logs, billing data, and build, release, or Hook metadata are intentionally excluded.",
    "operationId": "listDataRetentionCatalog",
    "xLunaCli": {
      "command": "retention.catalog",
      "classification": "business-command",
      "risk": "low",
      "requiredScopes": [
        "retention:read"
      ]
    }
  },
  {
    "method": "post",
    "path": "/api/v1/data-retention/preview",
    "tags": [
      "DataRetention"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/DataRetentionResultResponse"
        ],
        "description": "Matching counts by dataset. `deleted` is zero for a preview."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Invalid range or unknown dataset (`retention.invalid_range` or `retention.invalid_dataset`)."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Platform-administrator role is required."
      }
    ],
    "summary": "Preview data matching a retention range",
    "description": "Counts rows without changing data. The selected range is left-closed and right-open (`startAt <= timestamp < endAt`). Active runtime records and protected datasets are never matched.",
    "operationId": "previewDataRetention",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/DataRetentionRequest"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/DataRetentionRequest",
          "type": "object",
          "required": [
            "datasets",
            "endAt",
            "startAt"
          ],
          "properties": {
            "datasets": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": [
                  "platform_events",
                  "notification_deliveries",
                  "worker_task_events",
                  "build_logs",
                  "release_logs",
                  "hook_run_logs",
                  "expired_auth_data"
                ]
              },
              "minItems": 1,
              "uniqueItems": true
            },
            "endAt": {
              "type": "string",
              "format": "date-time"
            },
            "startAt": {
              "type": "string",
              "format": "date-time"
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "command": "retention.preview",
      "classification": "business-command",
      "risk": "low",
      "requiredScopes": [
        "retention:read"
      ]
    }
  },
  {
    "method": "post",
    "path": "/api/v1/data-retention/cleanup",
    "tags": [
      "DataRetention"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/DataRetentionResultResponse"
        ],
        "description": "Matched and deleted counts by dataset."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Invalid range or unknown dataset (`retention.invalid_range` or `retention.invalid_dataset`)."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Platform-administrator role or Step-up MFA assertion is required."
      },
      {
        "status": "500",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Cleanup failed (`retention.cleanup_failed`)."
      }
    ],
    "summary": "Permanently remove data matching a retention range",
    "description": "Runs the same fixed whitelist and protection rules as preview, then writes only the aggregate result to the audit log. The operation does not accept table names or SQL expressions. When Step-up MFA is enabled, a valid `data_retention_cleanup` assertion is also required.",
    "operationId": "cleanupDataRetention",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/DataRetentionRequest"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/DataRetentionRequest",
          "type": "object",
          "required": [
            "datasets",
            "endAt",
            "startAt"
          ],
          "properties": {
            "datasets": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": [
                  "platform_events",
                  "notification_deliveries",
                  "worker_task_events",
                  "build_logs",
                  "release_logs",
                  "hook_run_logs",
                  "expired_auth_data"
                ]
              },
              "minItems": 1,
              "uniqueItems": true
            },
            "endAt": {
              "type": "string",
              "format": "date-time"
            },
            "startAt": {
              "type": "string",
              "format": "date-time"
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "command": "retention.cleanup",
      "classification": "business-command",
      "risk": "critical",
      "requiredScopes": [
        "retention:manage"
      ]
    }
  },
  {
    "method": "post",
    "path": "/api/v1/runtime/clusters/{clusterId}/pods/terminal/authorize",
    "tags": [
      "Runtime"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      },
      {
        "BearerToken": []
      }
    ],
    "parameters": [
      {
        "name": "clusterId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ClusterId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "namespace",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "name",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/RuntimeTerminalAuthorization"
        ],
        "description": "One-time terminal ticket issued. The WebSocket endpoint must still atomically consume it and repeat authorization checks."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Pod namespace or name is empty."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Browser session or Luna CLI OAuth bearer is missing, invalid, expired, or revoked."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The current user is not a platform administrator, a personal access token was used (`mfa.session_required`), or Step-up verification is required (`mfa_required` with purpose `runtime_terminal`)."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Runtime cluster was not found."
      },
      {
        "status": "503",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The shared production terminal-ticket store is unavailable (`runtime_terminal.ticket_unavailable`)."
      }
    ],
    "summary": "Authorize a runtime-cluster Pod terminal connection",
    "description": "Normal HTTP preflight used before opening the Pod terminal WebSocket. Browser callers may use their existing session cookie; Luna CLI may use its OAuth bearer token when an active `runtime_terminal` Step-up assertion already exists. Personal access tokens are rejected. The response contains a short-lived random one-time ticket bound to the user, browser session or Luna CLI OAuth grant, assertion, cluster, and Pod. The WebSocket passes this ticket in its query string, consumes it atomically, repeats all authorization checks before upgrading, and revalidates identity, role, assertion, Pod identity, and platform ownership every three seconds while connected. Browser WebSockets that omit a ticket retain the existing cookie-based flow. Revocation or expiry closes the shell.",
    "operationId": "authorizeRuntimeClusterPodTerminal",
    "inputSchema": {
      "type": "object",
      "properties": {
        "clusterId": {
          "type": "string"
        },
        "namespace": {
          "type": "string"
        },
        "name": {
          "type": "string"
        }
      },
      "required": [
        "clusterId",
        "name",
        "namespace"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "classification": "protocol-adapter",
      "hidden": true,
      "exclusionReason": "Low-level terminal preflight consumed by the explicit CLI runtime-terminal protocol adapter."
    }
  },
  {
    "method": "get",
    "path": "/api/v1/runtime/clusters",
    "tags": [
      "Runtime"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "query",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "ref": "#/components/parameters/Page",
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "ref": "#/components/parameters/PageSize",
        "schema": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        }
      },
      {
        "name": "sortBy",
        "in": "query",
        "schema": {
          "type": "string",
          "enum": [
            "name",
            "type",
            "scope",
            "status",
            "createdAt"
          ],
          "default": "createdAt"
        }
      },
      {
        "name": "sortOrder",
        "in": "query",
        "ref": "#/components/parameters/SortOrder",
        "schema": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "default": "desc"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Runtime cluster list or paginated runtime cluster list."
      }
    ],
    "summary": "List runtime clusters",
    "description": "Returns the legacy array response when pagination parameters are omitted, or a paginated response when `page`/`pageSize` is supplied.",
    "operationId": "listRuntimeClusters",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "page": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        },
        "pageSize": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        },
        "sortBy": {
          "type": "string",
          "enum": [
            "name",
            "type",
            "scope",
            "status",
            "createdAt"
          ],
          "default": "createdAt"
        },
        "sortOrder": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "default": "desc"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/runtime/clusters",
    "tags": [
      "Runtime"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Create Runtime Cluster",
    "operationId": "createRuntimeCluster",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/RuntimeClusterInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/RuntimeClusterInput",
          "type": "object",
          "required": [
            "endpoint",
            "name",
            "scope",
            "type"
          ],
          "properties": {
            "endpoint": {
              "type": "string"
            },
            "gatewayCertificateNamespace": {
              "type": "string"
            },
            "gatewayCertIssuerKind": {
              "type": "string",
              "enum": [
                "Issuer",
                "ClusterIssuer"
              ]
            },
            "gatewayCertIssuerName": {
              "type": "string"
            },
            "gatewayClassName": {
              "type": "string"
            },
            "gatewayControllerType": {
              "type": "string",
              "enum": [
                "traefik",
                "generic"
              ]
            },
            "gatewayDefaultRequestHeaders": {
              "type": "string"
            },
            "gatewayDefaultResponseHeaders": {
              "type": "string"
            },
            "gatewayDomainSuffixes": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "gatewayExternalTLSMode": {
              "type": "string",
              "enum": [
                "none",
                "gateway",
                "upstream"
              ]
            },
            "gatewayForwardedHeadersMode": {
              "type": "string",
              "enum": [
                "preserve",
                "overwrite",
                "none"
              ]
            },
            "gatewayHttpListenerName": {
              "type": "string"
            },
            "gatewayHttpListenerPort": {
              "type": "integer",
              "minimum": 1,
              "maximum": 65535
            },
            "gatewayHttpsListenerName": {
              "type": "string"
            },
            "gatewayHttpsListenerPort": {
              "type": "integer",
              "minimum": 1,
              "maximum": 65535
            },
            "gatewayName": {
              "type": "string"
            },
            "gatewayNamespace": {
              "type": "string"
            },
            "gatewayProvider": {
              "type": "string",
              "enum": [
                "gateway-api"
              ]
            },
            "gatewayPublicPort": {
              "type": "integer",
              "minimum": 1,
              "maximum": 65535
            },
            "gatewayPublicScheme": {
              "type": "string",
              "enum": [
                "http",
                "https"
              ]
            },
            "gatewayRootDomain": {
              "type": "string"
            },
            "gatewayTlsSecretName": {
              "type": "string"
            },
            "gatewayTlsSecretNamespace": {
              "type": "string"
            },
            "gatewayTrustedProxyCIDRs": {
              "type": "string"
            },
            "gatewayWildcardCertDomain": {
              "type": "string"
            },
            "gatewayWildcardCertEnabled": {
              "type": "boolean"
            },
            "gatewayWildcardCertSecretName": {
              "type": "string"
            },
            "isDefault": {
              "type": "boolean"
            },
            "kubeconfig": {
              "type": "string",
              "writeOnly": true
            },
            "maxConcurrentBuilds": {
              "type": "integer",
              "minimum": 1
            },
            "name": {
              "type": "string",
              "minLength": 1
            },
            "ownerRef": {
              "type": "string"
            },
            "projectIds": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "scope": {
              "type": "string",
              "enum": [
                "global",
                "project",
                "user"
              ]
            },
            "status": {
              "type": "string"
            },
            "type": {
              "type": "string",
              "enum": [
                "kubernetes",
                "k3s"
              ]
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/git/providers",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "query",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Git provider list."
      }
    ],
    "summary": "List Git providers",
    "operationId": "listGitProviders",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/git/providers",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Created Git provider."
      }
    ],
    "summary": "Create Git provider",
    "operationId": "createGitProvider",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/GitProviderInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/GitProviderInput",
          "type": "object",
          "required": [
            "name"
          ],
          "properties": {
            "authType": {
              "type": "string",
              "enum": [
                "oauth",
                "github-app",
                "pat"
              ]
            },
            "baseUrl": {
              "type": "string"
            },
            "clientId": {
              "type": "string"
            },
            "clientSecret": {
              "type": "string",
              "writeOnly": true
            },
            "enabled": {
              "type": "boolean"
            },
            "name": {
              "type": "string"
            },
            "ownerRef": {
              "type": "string"
            },
            "scope": {
              "type": "string",
              "enum": [
                "global",
                "project",
                "user"
              ]
            },
            "type": {
              "type": "string",
              "enum": [
                "github",
                "gitea",
                "gitlab"
              ]
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/git/providers/{providerId}",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "providerId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProviderId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Updated Git provider."
      }
    ],
    "summary": "Update Git provider",
    "operationId": "updateGitProvider",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/GitProviderInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "providerId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/GitProviderInput",
          "type": "object",
          "required": [
            "name"
          ],
          "properties": {
            "authType": {
              "type": "string",
              "enum": [
                "oauth",
                "github-app",
                "pat"
              ]
            },
            "baseUrl": {
              "type": "string"
            },
            "clientId": {
              "type": "string"
            },
            "clientSecret": {
              "type": "string",
              "writeOnly": true
            },
            "enabled": {
              "type": "boolean"
            },
            "name": {
              "type": "string"
            },
            "ownerRef": {
              "type": "string"
            },
            "scope": {
              "type": "string",
              "enum": [
                "global",
                "project",
                "user"
              ]
            },
            "type": {
              "type": "string",
              "enum": [
                "github",
                "gitea",
                "gitlab"
              ]
            }
          }
        }
      },
      "required": [
        "body",
        "providerId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/git/providers/{providerId}",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "providerId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProviderId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Deleted Git provider."
      }
    ],
    "summary": "Delete Git provider",
    "operationId": "deleteGitProvider",
    "inputSchema": {
      "type": "object",
      "properties": {
        "providerId": {
          "type": "string"
        }
      },
      "required": [
        "providerId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/git/providers/{providerId}/oauth/start",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "providerId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProviderId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "redirect",
        "in": "query",
        "schema": {
          "type": "string",
          "default": "/projects"
        }
      },
      {
        "name": "frontendOrigin",
        "in": "query",
        "schema": {
          "type": "string",
          "default": ""
        }
      }
    ],
    "responses": [
      {
        "status": "302",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Redirect to Git OAuth provider."
      }
    ],
    "summary": "Start GitHub or Gitea OAuth flow",
    "operationId": "startGitOAuth",
    "inputSchema": {
      "type": "object",
      "properties": {
        "providerId": {
          "type": "string"
        },
        "redirect": {
          "type": "string",
          "default": "/projects"
        },
        "frontendOrigin": {
          "type": "string",
          "default": ""
        }
      },
      "required": [
        "providerId"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "hidden": true,
      "exclusionReason": "Protocol endpoint consumed by a browser, webhook, probe, stream, or terminal adapter instead of a regular CLI command."
    }
  },
  {
    "method": "get",
    "path": "/api/v1/git/oauth/callback",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "state",
        "in": "query",
        "required": true,
        "ref": "#/components/parameters/OAuthState",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "code",
        "in": "query",
        "required": true,
        "ref": "#/components/parameters/OAuthCode",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "302",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Redirect after Git OAuth callback."
      }
    ],
    "summary": "Complete Git OAuth callback",
    "operationId": "completeGitOAuth",
    "inputSchema": {
      "type": "object",
      "properties": {
        "state": {
          "type": "string"
        },
        "code": {
          "type": "string"
        }
      },
      "required": [
        "code",
        "state"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "hidden": true,
      "exclusionReason": "Protocol endpoint consumed by a browser, webhook, probe, stream, or terminal adapter instead of a regular CLI command."
    }
  },
  {
    "method": "post",
    "path": "/api/v1/git/webhooks/{bindingId}",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "bindingId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/BindingId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Webhook accepted."
      },
      {
        "status": "401",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Invalid webhook signature."
      }
    ],
    "summary": "Receive Git webhook event",
    "operationId": "receiveGitWebhook",
    "inputSchema": {
      "type": "object",
      "properties": {
        "bindingId": {
          "type": "string"
        }
      },
      "required": [
        "bindingId"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "hidden": true,
      "exclusionReason": "Protocol endpoint consumed by a browser, webhook, probe, stream, or terminal adapter instead of a regular CLI command."
    }
  },
  {
    "method": "get",
    "path": "/api/v1/git/accounts",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "query",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Git account list."
      }
    ],
    "summary": "List current user Git accounts",
    "operationId": "listGitAccounts",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/git/accounts",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Created Git account."
      }
    ],
    "summary": "Create current user Git account manually",
    "operationId": "createGitAccount",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/GitAccountInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/GitAccountInput",
          "type": "object",
          "required": [
            "providerId",
            "username"
          ],
          "properties": {
            "accessToken": {
              "type": "string",
              "writeOnly": true
            },
            "avatarUrl": {
              "type": "string"
            },
            "externalUserId": {
              "type": "string"
            },
            "ownerRef": {
              "type": "string"
            },
            "providerId": {
              "type": "string"
            },
            "refreshToken": {
              "type": "string",
              "writeOnly": true
            },
            "scope": {
              "type": "string",
              "enum": [
                "global",
                "project",
                "user"
              ]
            },
            "scopes": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "username": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/git/accounts/{accountId}",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "accountId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/AccountId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Updated Git account."
      }
    ],
    "summary": "Update current user Git account",
    "operationId": "updateGitAccount",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/GitAccountInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "accountId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/GitAccountInput",
          "type": "object",
          "required": [
            "providerId",
            "username"
          ],
          "properties": {
            "accessToken": {
              "type": "string",
              "writeOnly": true
            },
            "avatarUrl": {
              "type": "string"
            },
            "externalUserId": {
              "type": "string"
            },
            "ownerRef": {
              "type": "string"
            },
            "providerId": {
              "type": "string"
            },
            "refreshToken": {
              "type": "string",
              "writeOnly": true
            },
            "scope": {
              "type": "string",
              "enum": [
                "global",
                "project",
                "user"
              ]
            },
            "scopes": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "username": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "accountId",
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/git/accounts/{accountId}",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "accountId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/AccountId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Deleted Git account."
      }
    ],
    "summary": "Delete current user Git account",
    "operationId": "deleteGitAccount",
    "inputSchema": {
      "type": "object",
      "properties": {
        "accountId": {
          "type": "string"
        }
      },
      "required": [
        "accountId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/git/accounts/{accountId}/refresh",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "accountId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/AccountId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Refreshed Git account."
      }
    ],
    "summary": "Refresh current user Git account token",
    "operationId": "refreshGitAccount",
    "inputSchema": {
      "type": "object",
      "properties": {
        "accountId": {
          "type": "string"
        }
      },
      "required": [
        "accountId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/git/accounts/{accountId}/repositories",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "accountId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/AccountId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "ref": "#/components/parameters/Page",
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "ref": "#/components/parameters/PageSize",
        "schema": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        }
      },
      {
        "name": "search",
        "in": "query",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Repository list."
      }
    ],
    "summary": "List repositories visible to a Git account",
    "operationId": "listGitRepositories",
    "inputSchema": {
      "type": "object",
      "properties": {
        "accountId": {
          "type": "string"
        },
        "page": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        },
        "pageSize": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        },
        "search": {
          "type": "string"
        }
      },
      "required": [
        "accountId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/git/accounts/{accountId}/repositories/{owner}/{repo}/branches",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "accountId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/AccountId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "owner",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/Owner",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "repo",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/Repo",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Branch list."
      }
    ],
    "summary": "List repository branches",
    "operationId": "listGitBranches",
    "inputSchema": {
      "type": "object",
      "properties": {
        "accountId": {
          "type": "string"
        },
        "owner": {
          "type": "string"
        },
        "repo": {
          "type": "string"
        }
      },
      "required": [
        "accountId",
        "owner",
        "repo"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/git/accounts/{accountId}/repositories/{owner}/{repo}/file",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "accountId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/AccountId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "owner",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/Owner",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "repo",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/Repo",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "path",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "ref",
        "in": "query",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "File content."
      }
    ],
    "summary": "Read repository file content",
    "operationId": "readGitFile",
    "inputSchema": {
      "type": "object",
      "properties": {
        "accountId": {
          "type": "string"
        },
        "owner": {
          "type": "string"
        },
        "repo": {
          "type": "string"
        },
        "path": {
          "type": "string"
        },
        "ref": {
          "type": "string"
        }
      },
      "required": [
        "accountId",
        "owner",
        "path",
        "repo"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/registries",
    "tags": [
      "Registries"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "query",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "ref": "#/components/parameters/Page",
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "ref": "#/components/parameters/PageSize",
        "schema": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        }
      },
      {
        "name": "sortBy",
        "in": "query",
        "schema": {
          "type": "string",
          "enum": [
            "name",
            "scope",
            "createdAt"
          ],
          "default": "createdAt"
        }
      },
      {
        "name": "sortOrder",
        "in": "query",
        "ref": "#/components/parameters/SortOrder",
        "schema": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "default": "desc"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Artifact registry list."
      }
    ],
    "summary": "List artifact registries",
    "operationId": "listArtifactRegistries",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "page": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        },
        "pageSize": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        },
        "sortBy": {
          "type": "string",
          "enum": [
            "name",
            "scope",
            "createdAt"
          ],
          "default": "createdAt"
        },
        "sortOrder": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "default": "desc"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/registries",
    "tags": [
      "Registries"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Created artifact registry."
      }
    ],
    "summary": "Create artifact registry",
    "operationId": "createArtifactRegistry",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/ArtifactRegistryInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/ArtifactRegistryInput",
          "type": "object",
          "required": [
            "endpoint",
            "name",
            "provider",
            "scope"
          ],
          "properties": {
            "capabilities": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "endpoint": {
              "type": "string"
            },
            "isDefault": {
              "type": "boolean"
            },
            "name": {
              "type": "string"
            },
            "namespace": {
              "type": "string"
            },
            "ownerRef": {
              "type": "string"
            },
            "provider": {
              "type": "string",
              "enum": [
                "harbor",
                "dockerhub",
                "gitea-registry"
              ]
            },
            "scope": {
              "type": "string",
              "enum": [
                "global",
                "project",
                "user"
              ]
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/registries/{registryId}",
    "tags": [
      "Registries"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "registryId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/RegistryId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Updated artifact registry."
      }
    ],
    "summary": "Update artifact registry",
    "operationId": "updateArtifactRegistry",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/ArtifactRegistryInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "registryId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/ArtifactRegistryInput",
          "type": "object",
          "required": [
            "endpoint",
            "name",
            "provider",
            "scope"
          ],
          "properties": {
            "capabilities": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "endpoint": {
              "type": "string"
            },
            "isDefault": {
              "type": "boolean"
            },
            "name": {
              "type": "string"
            },
            "namespace": {
              "type": "string"
            },
            "ownerRef": {
              "type": "string"
            },
            "provider": {
              "type": "string",
              "enum": [
                "harbor",
                "dockerhub",
                "gitea-registry"
              ]
            },
            "scope": {
              "type": "string",
              "enum": [
                "global",
                "project",
                "user"
              ]
            }
          }
        }
      },
      "required": [
        "body",
        "registryId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/registries/{registryId}",
    "tags": [
      "Registries"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "registryId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/RegistryId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Deleted artifact registry."
      }
    ],
    "summary": "Delete artifact registry",
    "operationId": "deleteArtifactRegistry",
    "inputSchema": {
      "type": "object",
      "properties": {
        "registryId": {
          "type": "string"
        }
      },
      "required": [
        "registryId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/registries/{registryId}/test",
    "tags": [
      "Registries"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "registryId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/RegistryId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Registry test result."
      }
    ],
    "summary": "Test artifact registry connectivity",
    "operationId": "testArtifactRegistry",
    "inputSchema": {
      "type": "object",
      "properties": {
        "registryId": {
          "type": "string"
        }
      },
      "required": [
        "registryId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/registries/{registryId}/credentials",
    "tags": [
      "Registries"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "registryId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/RegistryId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "ref": "#/components/parameters/Page",
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "ref": "#/components/parameters/PageSize",
        "schema": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        }
      },
      {
        "name": "sortBy",
        "in": "query",
        "schema": {
          "type": "string",
          "enum": [
            "name",
            "username",
            "createdAt"
          ],
          "default": "createdAt"
        }
      },
      {
        "name": "sortOrder",
        "in": "query",
        "ref": "#/components/parameters/SortOrder",
        "schema": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "default": "desc"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Registry credential list."
      }
    ],
    "summary": "List registry credentials",
    "operationId": "listRegistryCredentials",
    "inputSchema": {
      "type": "object",
      "properties": {
        "registryId": {
          "type": "string"
        },
        "page": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        },
        "pageSize": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        },
        "sortBy": {
          "type": "string",
          "enum": [
            "name",
            "username",
            "createdAt"
          ],
          "default": "createdAt"
        },
        "sortOrder": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "default": "desc"
        }
      },
      "required": [
        "registryId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/registries/{registryId}/credentials",
    "tags": [
      "Registries"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "registryId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/RegistryId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "201",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Created registry credential."
      }
    ],
    "summary": "Create registry credential",
    "operationId": "createRegistryCredential",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/RegistryCredentialInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "registryId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/RegistryCredentialInput",
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "password": {
              "type": "string"
            },
            "projectIds": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "repositoryTemplate": {
              "type": "string"
            },
            "scope": {
              "type": "string",
              "enum": [
                "user",
                "project",
                "global"
              ]
            },
            "tagTemplate": {
              "type": "string"
            },
            "token": {
              "type": "string"
            },
            "usage": {
              "type": "string",
              "enum": [
                "pull",
                "push",
                "push-pull"
              ]
            },
            "username": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body",
        "registryId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/registry-credentials",
    "tags": [
      "Registries"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "ref": "#/components/parameters/Page",
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "ref": "#/components/parameters/PageSize",
        "schema": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        }
      },
      {
        "name": "sortBy",
        "in": "query",
        "schema": {
          "type": "string",
          "enum": [
            "name",
            "username",
            "createdAt"
          ],
          "default": "createdAt"
        }
      },
      {
        "name": "sortOrder",
        "in": "query",
        "ref": "#/components/parameters/SortOrder",
        "schema": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "default": "desc"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Paginated registry credential list."
      }
    ],
    "summary": "List visible registry credentials across registries",
    "operationId": "listAllRegistryCredentials",
    "inputSchema": {
      "type": "object",
      "properties": {
        "page": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        },
        "pageSize": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        },
        "sortBy": {
          "type": "string",
          "enum": [
            "name",
            "username",
            "createdAt"
          ],
          "default": "createdAt"
        },
        "sortOrder": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "default": "desc"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/registries/{registryId}/credentials/{credentialId}",
    "tags": [
      "Registries"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "registryId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/RegistryId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "credentialId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/CredentialId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/RegistryCredential"
        ],
        "description": "Updated registry credential."
      }
    ],
    "summary": "Update registry credential",
    "operationId": "updateRegistryCredential",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/RegistryCredentialInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "registryId": {
          "type": "string"
        },
        "credentialId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/RegistryCredentialInput",
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "password": {
              "type": "string"
            },
            "projectIds": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "repositoryTemplate": {
              "type": "string"
            },
            "scope": {
              "type": "string",
              "enum": [
                "user",
                "project",
                "global"
              ]
            },
            "tagTemplate": {
              "type": "string"
            },
            "token": {
              "type": "string"
            },
            "usage": {
              "type": "string",
              "enum": [
                "pull",
                "push",
                "push-pull"
              ]
            },
            "username": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body",
        "credentialId",
        "registryId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/registries/{registryId}/credentials/{credentialId}",
    "tags": [
      "Registries"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "registryId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/RegistryId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "credentialId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/CredentialId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Deleted registry credential."
      }
    ],
    "summary": "Delete registry credential",
    "operationId": "deleteRegistryCredential",
    "inputSchema": {
      "type": "object",
      "properties": {
        "registryId": {
          "type": "string"
        },
        "credentialId": {
          "type": "string"
        }
      },
      "required": [
        "credentialId",
        "registryId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/container-images",
    "tags": [
      "Registries"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "query",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "applicationId",
        "in": "query",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "registryId",
        "in": "query",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Container image list."
      }
    ],
    "summary": "List container image records",
    "operationId": "listContainerImages",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        },
        "registryId": {
          "type": "string"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/container-images",
    "tags": [
      "Registries"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Created container image record."
      }
    ],
    "summary": "Create container image record",
    "operationId": "createContainerImage",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/ContainerImageInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/ContainerImageInput",
          "type": "object",
          "required": [
            "registryId",
            "repository",
            "tag"
          ],
          "properties": {
            "applicationId": {
              "type": "string"
            },
            "buildRunId": {
              "type": "string"
            },
            "digest": {
              "type": "string"
            },
            "imageRef": {
              "type": "string"
            },
            "projectId": {
              "type": "string"
            },
            "registryId": {
              "type": "string"
            },
            "repository": {
              "type": "string"
            },
            "scanStatus": {
              "type": "string"
            },
            "sourceCommit": {
              "type": "string"
            },
            "sourceType": {
              "type": "string"
            },
            "tag": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/dashboard",
    "tags": [
      "Dashboard"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/DashboardOverview"
        ],
        "description": "Dashboard overview scoped to the current user's visible project spaces and resources."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Authentication is required."
      },
      {
        "status": "500",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Dashboard aggregation failed (`dashboard.load_failed`)."
      }
    ],
    "summary": "Get the current user's dashboard overview",
    "description": "Returns the task-oriented dashboard aggregation in one response. Future dashboard read models are added to this contract instead of being composed from multiple browser requests.",
    "operationId": "getDashboard",
    "xLunaCli": {
      "command": "dashboard.show",
      "classification": "business-command",
      "risk": "low",
      "requiredScopes": [
        "dashboard:read"
      ]
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "ref": "#/components/parameters/Page",
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "ref": "#/components/parameters/PageSize",
        "schema": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        }
      },
      {
        "name": "sortBy",
        "in": "query",
        "schema": {
          "type": "string",
          "enum": [
            "createdAt",
            "name",
            "identifier"
          ],
          "default": "createdAt"
        }
      },
      {
        "name": "sortOrder",
        "in": "query",
        "ref": "#/components/parameters/SortOrder",
        "schema": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "default": "desc"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/Project",
          "#/components/schemas/PaginatedProjectList"
        ],
        "description": "Project list or paginated project list."
      }
    ],
    "summary": "List projects",
    "description": "Returns the legacy project array when pagination parameters are omitted. Returns a paginated object when page or pageSize is provided.",
    "operationId": "listProjects",
    "inputSchema": {
      "type": "object",
      "properties": {
        "page": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        },
        "pageSize": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        },
        "sortBy": {
          "type": "string",
          "enum": [
            "createdAt",
            "name",
            "identifier"
          ],
          "default": "createdAt"
        },
        "sortOrder": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "default": "desc"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Created project."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested state transition conflicts with the current durable state."
      }
    ],
    "summary": "Create project",
    "operationId": "createProject",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/ProjectInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/ProjectInput",
          "type": "object",
          "required": [
            "identifier",
            "name"
          ],
          "properties": {
            "description": {
              "type": "string"
            },
            "identifier": {
              "type": "string",
              "description": "Human-readable identifier that is immutable while the project space exists and unique among active project spaces. It may be reused after deletion cleanup; the internal project ID is generated independently and the identifier derives the Kubernetes Namespace.",
              "minLength": 2,
              "maxLength": 22,
              "pattern": "^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$"
            },
            "maxConcurrentBuilds": {
              "type": "integer",
              "minimum": 1
            },
            "name": {
              "type": "string"
            },
            "namespaceStrategy": {
              "type": "string",
              "enum": [
                "project"
              ]
            },
            "webConsoleEnabled": {
              "type": "boolean",
              "description": "Project-space master switch for release Web Console and runtime exec access. Omission on create defaults to true; omission on update preserves the current value. When false, no deployment target can re-enable Web Console. Project roles and Step-up MFA still apply.",
              "default": true
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/pins",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Pinned project list."
      }
    ],
    "summary": "List current user's pinned projects",
    "operationId": "listProjectPins"
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Project."
      }
    ],
    "summary": "Get project",
    "operationId": "getProject",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        }
      },
      "required": [
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/projects/{projectId}",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Updated project."
      }
    ],
    "summary": "Update project",
    "operationId": "updateProject",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/ProjectInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/ProjectInput",
          "type": "object",
          "required": [
            "identifier",
            "name"
          ],
          "properties": {
            "description": {
              "type": "string"
            },
            "identifier": {
              "type": "string",
              "description": "Human-readable identifier that is immutable while the project space exists and unique among active project spaces. It may be reused after deletion cleanup; the internal project ID is generated independently and the identifier derives the Kubernetes Namespace.",
              "minLength": 2,
              "maxLength": 22,
              "pattern": "^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$"
            },
            "maxConcurrentBuilds": {
              "type": "integer",
              "minimum": 1
            },
            "name": {
              "type": "string"
            },
            "namespaceStrategy": {
              "type": "string",
              "enum": [
                "project"
              ]
            },
            "webConsoleEnabled": {
              "type": "boolean",
              "description": "Project-space master switch for release Web Console and runtime exec access. Omission on create defaults to true; omission on update preserves the current value. When false, no deployment target can re-enable Web Console. Project roles and Step-up MFA still apply.",
              "default": true
            }
          }
        }
      },
      "required": [
        "body",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/projects/{projectId}",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Deleted project."
      }
    ],
    "summary": "Delete project",
    "operationId": "deleteProject",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        }
      },
      "required": [
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/projects/{projectId}/pin",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Updated pinned project."
      },
      {
        "status": "201",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Created pinned project."
      }
    ],
    "summary": "Pin project for current user",
    "operationId": "pinProject",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        }
      },
      "required": [
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/projects/{projectId}/pin",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Unpinned project."
      }
    ],
    "summary": "Unpin project for current user",
    "operationId": "unpinProject",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        }
      },
      "required": [
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/registries/default",
    "tags": [
      "Registries"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Default artifact registry."
      }
    ],
    "summary": "Get default artifact registry for a project",
    "operationId": "getDefaultArtifactRegistry",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        }
      },
      "required": [
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/members",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Project member list."
      }
    ],
    "summary": "List project members",
    "operationId": "listProjectMembers",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        }
      },
      "required": [
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/members",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "201",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Created project member."
      }
    ],
    "summary": "Create project member",
    "operationId": "createProjectMember",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/ProjectMemberInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/ProjectMemberInput",
          "type": "object",
          "required": [
            "email",
            "role"
          ],
          "properties": {
            "email": {
              "type": "string"
            },
            "role": {
              "ref": "#/components/schemas/ProjectRole",
              "type": "string",
              "enum": [
                "owner",
                "admin",
                "developer",
                "viewer"
              ]
            }
          }
        }
      },
      "required": [
        "body",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/billing-owner-transfer-requests",
    "tags": [
      "Inbox",
      "Billing"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      },
      {
        "BearerToken": []
      }
    ],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/InboxActionRequest"
        ],
        "description": "Pending billing-owner transfer action request."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested state transition conflicts with the current durable state."
      }
    ],
    "summary": "Request transfer of a project's future billing ownership",
    "description": "Creates a pending inbox action request for an active project member. Historical usage and ledger entries are not transferred.",
    "operationId": "createBillingOwnerTransferRequest",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/BillingOwnerTransferRequestInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/BillingOwnerTransferRequestInput",
          "type": "object",
          "required": [
            "recipientUserId"
          ],
          "properties": {
            "recipientUserId": {
              "type": "string",
              "minLength": 1
            }
          },
          "additionalProperties": false
        }
      },
      "required": [
        "body",
        "projectId"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "hidden": true,
      "exclusionReason": "Billing-owner transfer is currently completed through the interactive inbox decision workflow."
    }
  },
  {
    "method": "put",
    "path": "/api/v1/projects/{projectId}/members/{memberId}",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "memberId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/MemberId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Updated project member."
      }
    ],
    "summary": "Update project member",
    "operationId": "updateProjectMember",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/ProjectMemberInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "memberId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/ProjectMemberInput",
          "type": "object",
          "required": [
            "email",
            "role"
          ],
          "properties": {
            "email": {
              "type": "string"
            },
            "role": {
              "ref": "#/components/schemas/ProjectRole",
              "type": "string",
              "enum": [
                "owner",
                "admin",
                "developer",
                "viewer"
              ]
            }
          }
        }
      },
      "required": [
        "body",
        "memberId",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/projects/{projectId}/members/{memberId}",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "memberId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/MemberId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Deleted project member."
      }
    ],
    "summary": "Delete project member",
    "operationId": "deleteProjectMember",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "memberId": {
          "type": "string"
        }
      },
      "required": [
        "memberId",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/applications",
    "tags": [
      "Applications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "ref": "#/components/parameters/Page",
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "ref": "#/components/parameters/PageSize",
        "schema": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        }
      },
      {
        "name": "search",
        "in": "query",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "sortBy",
        "in": "query",
        "schema": {
          "type": "string",
          "enum": [
            "createdAt",
            "name",
            "identifier"
          ],
          "default": "createdAt"
        }
      },
      {
        "name": "sortOrder",
        "in": "query",
        "ref": "#/components/parameters/SortOrder",
        "schema": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "default": "desc"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Application list or paginated application list."
      }
    ],
    "summary": "List applications",
    "operationId": "listApplications",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "page": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        },
        "pageSize": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        },
        "search": {
          "type": "string"
        },
        "sortBy": {
          "type": "string",
          "enum": [
            "createdAt",
            "name",
            "identifier"
          ],
          "default": "createdAt"
        },
        "sortOrder": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "default": "desc"
        }
      },
      "required": [
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/applications",
    "tags": [
      "Applications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "201",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Created application."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested state transition conflicts with the current durable state."
      }
    ],
    "summary": "Create application",
    "operationId": "createApplication",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/ApplicationInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/ApplicationInput",
          "type": "object",
          "required": [
            "identifier",
            "name",
            "sourceType"
          ],
          "properties": {
            "buildContext": {
              "type": "string"
            },
            "dockerfilePath": {
              "type": "string"
            },
            "identifier": {
              "type": "string",
              "description": "Human-readable identifier that is immutable while the application exists and unique among active applications in the project space. It may be reused after deletion cleanup; the internal application ID is generated independently.",
              "minLength": 2,
              "maxLength": 22,
              "pattern": "^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$"
            },
            "imageReference": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "repositoryUrl": {
              "type": "string"
            },
            "servicePort": {
              "type": "integer"
            },
            "sourceType": {
              "type": "string",
              "enum": [
                "repository",
                "image"
              ]
            }
          }
        }
      },
      "required": [
        "body",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/applications/{applicationId}",
    "tags": [
      "Applications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "applicationId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ApplicationId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Application."
      }
    ],
    "summary": "Get application",
    "operationId": "getApplication",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        }
      },
      "required": [
        "applicationId",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/projects/{projectId}/applications/{applicationId}",
    "tags": [
      "Applications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "applicationId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ApplicationId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Updated application."
      }
    ],
    "summary": "Update application",
    "operationId": "updateApplication",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/ApplicationInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/ApplicationInput",
          "type": "object",
          "required": [
            "identifier",
            "name",
            "sourceType"
          ],
          "properties": {
            "buildContext": {
              "type": "string"
            },
            "dockerfilePath": {
              "type": "string"
            },
            "identifier": {
              "type": "string",
              "description": "Human-readable identifier that is immutable while the application exists and unique among active applications in the project space. It may be reused after deletion cleanup; the internal application ID is generated independently.",
              "minLength": 2,
              "maxLength": 22,
              "pattern": "^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$"
            },
            "imageReference": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "repositoryUrl": {
              "type": "string"
            },
            "servicePort": {
              "type": "integer"
            },
            "sourceType": {
              "type": "string",
              "enum": [
                "repository",
                "image"
              ]
            }
          }
        }
      },
      "required": [
        "applicationId",
        "body",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/projects/{projectId}/applications/{applicationId}",
    "tags": [
      "Applications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "applicationId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ApplicationId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Deleted application."
      }
    ],
    "summary": "Delete application",
    "operationId": "deleteApplication",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        }
      },
      "required": [
        "applicationId",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/applications/{applicationId}/topology",
    "tags": [
      "Applications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "applicationId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ApplicationId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ApplicationTopology"
        ],
        "description": "Live application topology. Unavailable deployment targets are returned as warnings while readable targets remain available."
      }
    ],
    "summary": "Compute the current Kubernetes resource topology for an application",
    "operationId": "getApplicationTopology",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        }
      },
      "required": [
        "applicationId",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/applications/{applicationId}/deployment-targets",
    "tags": [
      "Deployments"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "applicationId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ApplicationId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/DeploymentTarget"
        ],
        "description": "Deployment target list."
      }
    ],
    "summary": "List deployment targets for an application",
    "operationId": "listDeploymentTargets",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        }
      },
      "required": [
        "applicationId",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/applications/{applicationId}/deployment-targets",
    "tags": [
      "Deployments"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "applicationId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ApplicationId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/DeploymentTarget"
        ],
        "description": "Created deployment target."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested state transition conflicts with the current durable state."
      }
    ],
    "summary": "Create a deployment target",
    "operationId": "createDeploymentTarget",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/DeploymentTargetInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/DeploymentTargetInput",
          "type": "object",
          "description": "Complete deployment target create/update payload used by the console, CLI, and Agent. Repository sources require repositoryBindingId; image sources require imageRef. Omitted optional fields use platform defaults.",
          "properties": {
            "affinity": {
              "type": "string",
              "description": "JSON Kubernetes affinity object."
            },
            "allowPrivilegeEscalation": {
              "type": "string",
              "description": "Tri-state string; empty inherits the platform default.",
              "enum": [
                "",
                "true",
                "false"
              ]
            },
            "autoDeploy": {
              "type": "boolean",
              "default": false
            },
            "automountServiceAccountToken": {
              "type": "string",
              "description": "Tri-state string controlling ServiceAccount token mounting; empty uses the Kubernetes default.",
              "enum": [
                "",
                "true",
                "false"
              ]
            },
            "autoScalingBehavior": {
              "type": "string",
              "description": "JSON Kubernetes horizontal pod autoscaler behavior object."
            },
            "autoScalingCpuPercent": {
              "type": "integer",
              "minimum": 0,
              "maximum": 1000
            },
            "autoScalingEnabled": {
              "type": "boolean",
              "default": false
            },
            "autoScalingMaxReplicas": {
              "type": "integer",
              "minimum": 1
            },
            "autoScalingMemoryPercent": {
              "type": "integer",
              "minimum": 0,
              "maximum": 1000
            },
            "autoScalingMinReplicas": {
              "type": "integer",
              "minimum": 1
            },
            "branchPattern": {
              "type": "string"
            },
            "buildArgs": {
              "type": "string",
              "description": "Newline-separated Docker build arguments in KEY=value form."
            },
            "buildContext": {
              "type": "string",
              "default": "."
            },
            "buildCpuRequest": {
              "type": "string",
              "default": "2"
            },
            "buildDefinitionMode": {
              "type": "string",
              "description": "Selects the repository Dockerfile or a platform-rendered template Dockerfile.",
              "enum": [
                "repository_dockerfile",
                "template"
              ],
              "default": "repository_dockerfile"
            },
            "buildDirectory": {
              "type": "string",
              "description": "Optional working directory within the build context."
            },
            "buildEnvironmentId": {
              "type": "string",
              "description": "Optional reusable build environment reference."
            },
            "buildHookBindings": {
              "type": "array",
              "items": {
                "type": "object",
                "required": [
                  "hookConfigId",
                  "phase"
                ],
                "properties": {
                  "hookConfigId": {
                    "type": "string"
                  },
                  "phase": {
                    "type": "string"
                  },
                  "runOrder": {
                    "type": "integer",
                    "minimum": 0
                  }
                },
                "additionalProperties": false
              }
            },
            "buildHooksEnabled": {
              "type": "boolean",
              "default": true
            },
            "buildLabels": {
              "type": "string",
              "description": "Comma-separated build selector labels."
            },
            "buildMemoryRequest": {
              "type": "string",
              "default": "4Gi"
            },
            "buildSecrets": {
              "type": "object",
              "description": "Optional deployment-level secret updates. Existing keys with an empty value are retained; omitted keys are removed. Values are encrypted and never returned.",
              "writeOnly": true,
              "additionalProperties": {
                "type": "string"
              }
            },
            "buildTemplateId": {
              "type": "string",
              "description": "Required when buildDefinitionMode is template."
            },
            "buildTemplateValues": {
              "type": "string",
              "description": "JSON object containing validated template parameters."
            },
            "buildTemplateVersion": {
              "type": "string",
              "description": "Immutable built-in template version. An empty value selects the current version."
            },
            "buildTimeoutSeconds": {
              "type": "integer",
              "default": 1800,
              "minimum": 60,
              "maximum": 86400
            },
            "buildVariables": {
              "type": "object",
              "description": "Optional deployment-level values that override matching application, project, and global keys.",
              "additionalProperties": {
                "type": "string"
              }
            },
            "buildVariableSetIds": {
              "type": "array",
              "description": "Project build variable set IDs.",
              "items": {
                "type": "string"
              }
            },
            "capabilityAdd": {
              "type": "string",
              "description": "JSON string array or line-separated Linux capabilities to add."
            },
            "capabilityDrop": {
              "type": "string",
              "description": "JSON string array or line-separated Linux capabilities to drop."
            },
            "clusterId": {
              "type": "string",
              "description": "Runtime cluster ID available to the project. Empty selects the platform default cluster."
            },
            "concurrencyPolicy": {
              "type": "string",
              "enum": [
                "queue",
                "parallel"
              ],
              "default": "queue"
            },
            "configFiles": {
              "type": "string",
              "description": "JSON array of runtime configuration file mounts."
            },
            "configRefs": {
              "type": "string",
              "description": "Serialized runtime ConfigMap references."
            },
            "containerArgs": {
              "type": "string",
              "description": "JSON string array or line-separated container arguments."
            },
            "containerCommand": {
              "type": "string",
              "description": "JSON string array or line-separated container command."
            },
            "cpuLimit": {
              "type": "string",
              "description": "Optional Kubernetes CPU limit."
            },
            "cpuRequest": {
              "type": "string",
              "description": "Kubernetes CPU quantity for each replica.",
              "default": "1"
            },
            "dataAccessMode": {
              "type": "string",
              "enum": [
                "ReadWriteOnce",
                "ReadOnlyMany",
                "ReadWriteMany"
              ]
            },
            "dataCapacity": {
              "type": "string",
              "default": "1Gi"
            },
            "dataMountPath": {
              "type": "string",
              "default": "/data"
            },
            "dataRetentionEnabled": {
              "type": "boolean",
              "default": false
            },
            "dataStorageClassName": {
              "type": "string"
            },
            "dataVolumeMode": {
              "type": "string",
              "enum": [
                "Filesystem",
                "Block"
              ]
            },
            "dataVolumes": {
              "type": "string",
              "description": "JSON array of managed, existingClaim, or emptyDir data-volume objects."
            },
            "dockerfilePath": {
              "type": "string",
              "default": "Dockerfile"
            },
            "enabled": {
              "type": "boolean",
              "default": true
            },
            "environmentId": {
              "type": "string",
              "description": "Optional project environment reference."
            },
            "envVars": {
              "type": "string",
              "description": "JSON object or newline-separated runtime environment variables."
            },
            "fsGroup": {
              "type": "string",
              "pattern": "^[0-9]*$"
            },
            "fsGroupChangePolicy": {
              "type": "string",
              "enum": [
                "Always",
                "OnRootMismatch"
              ]
            },
            "imagePullPolicy": {
              "type": "string",
              "enum": [
                "Always",
                "IfNotPresent",
                "Never"
              ]
            },
            "imageRef": {
              "type": "string",
              "description": "Existing OCI image reference used when sourceType is image."
            },
            "initContainers": {
              "type": "string",
              "description": "JSON array of Kubernetes init containers."
            },
            "lifecycle": {
              "type": "string",
              "description": "JSON Kubernetes lifecycle object."
            },
            "livenessProbe": {
              "type": "string",
              "description": "JSON Kubernetes liveness probe."
            },
            "memoryLimit": {
              "type": "string",
              "description": "Optional Kubernetes memory limit."
            },
            "memoryRequest": {
              "type": "string",
              "description": "Kubernetes memory quantity for each replica.",
              "default": "1Gi"
            },
            "name": {
              "type": "string",
              "description": "Display name. Defaults to the normalized stage.",
              "maxLength": 120
            },
            "namespace": {
              "type": "string",
              "description": "Optional Kubernetes namespace override. Empty uses the project namespace."
            },
            "nodeSelector": {
              "type": "string",
              "description": "JSON object or key=value lines."
            },
            "priorityClassName": {
              "type": "string"
            },
            "readinessProbe": {
              "type": "string",
              "description": "JSON Kubernetes readiness probe."
            },
            "readOnlyRootFilesystem": {
              "type": "boolean",
              "default": false
            },
            "replicas": {
              "type": "integer",
              "default": 1,
              "minimum": 1
            },
            "repositoryBindingId": {
              "type": "string",
              "description": "Required when sourceType is repository; must belong to the same application."
            },
            "requireApproval": {
              "type": "boolean",
              "default": false
            },
            "runAsGroup": {
              "type": "string",
              "pattern": "^[0-9]*$"
            },
            "runAsUser": {
              "type": "string",
              "pattern": "^[0-9]*$"
            },
            "runtimeConfigRefs": {
              "type": "array",
              "items": {
                "type": "object",
                "required": [
                  "setId"
                ],
                "properties": {
                  "mode": {
                    "type": "string",
                    "enum": [
                      "live",
                      "snapshot"
                    ],
                    "default": "live"
                  },
                  "setId": {
                    "type": "string"
                  }
                },
                "additionalProperties": false
              }
            },
            "runtimeConfigSetIds": {
              "type": "array",
              "description": "Legacy shorthand for live runtime configuration references.",
              "items": {
                "type": "string"
              }
            },
            "secretFiles": {
              "type": "string",
              "description": "JSON array of runtime secret file inputs. Existing plaintext values are never returned.",
              "writeOnly": true
            },
            "secretRefs": {
              "type": "string",
              "description": "Serialized runtime Secret references; plaintext secret values are not accepted here."
            },
            "serviceAccountName": {
              "type": "string",
              "description": "Optional Kubernetes ServiceAccount name used by the workload Pods.",
              "maxLength": 253,
              "pattern": "^$|^[a-z0-9]([-a-z0-9.]*[a-z0-9])?$"
            },
            "serviceAnnotations": {
              "type": "string",
              "description": "JSON object or key=value lines."
            },
            "serviceExternalTrafficPolicy": {
              "type": "string",
              "enum": [
                "Cluster",
                "Local"
              ]
            },
            "servicePort": {
              "type": "integer",
              "description": "Legacy single-port fallback used when servicePorts is empty.",
              "default": 8080,
              "minimum": 1,
              "maximum": 65535
            },
            "servicePorts": {
              "type": "array",
              "description": "Unique container service ports.",
              "items": {
                "type": "object",
                "required": [
                  "port"
                ],
                "properties": {
                  "appProtocol": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  },
                  "port": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 65535
                  }
                },
                "additionalProperties": false
              },
              "maxItems": 16
            },
            "serviceSessionAffinity": {
              "type": "string",
              "enum": [
                "None",
                "ClientIP"
              ]
            },
            "serviceType": {
              "type": "string",
              "enum": [
                "ClusterIP",
                "NodePort",
                "LoadBalancer"
              ]
            },
            "sidecarContainers": {
              "type": "string",
              "description": "JSON array of Kubernetes sidecar containers."
            },
            "sourceType": {
              "type": "string",
              "description": "Repository builds source code; image deploys an existing image directly.",
              "enum": [
                "repository",
                "image"
              ]
            },
            "stage": {
              "type": "string",
              "description": "Immutable stage identifier, unique among active deployment targets in the application. It may be reused after deletion cleanup.",
              "enum": [
                "dev",
                "test",
                "staging",
                "prod"
              ],
              "default": "dev"
            },
            "startupProbe": {
              "type": "string",
              "description": "JSON Kubernetes startup probe."
            },
            "tagPattern": {
              "type": "string"
            },
            "targetImageRef": {
              "type": "string",
              "description": "Combined target repository and tag for repository builds."
            },
            "targetRegistryId": {
              "type": "string",
              "description": "Registry credential used to push repository builds."
            },
            "targetRepository": {
              "type": "string"
            },
            "targetTag": {
              "type": "string",
              "default": "latest"
            },
            "tolerations": {
              "type": "string",
              "description": "JSON Kubernetes toleration array."
            },
            "topologySpreadConstraints": {
              "type": "string",
              "description": "JSON Kubernetes topology spread constraint array."
            },
            "webConsoleEnabled": {
              "type": [
                "boolean",
                "null"
              ],
              "description": "`null` inherits the project-space master switch and `false` disables Web Console for this deployment target.",
              "default": null
            },
            "workloadType": {
              "type": "string",
              "enum": [
                "Deployment",
                "StatefulSet"
              ],
              "default": "Deployment"
            }
          },
          "additionalProperties": false
        }
      },
      "required": [
        "applicationId",
        "body",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/projects/{projectId}/applications/{applicationId}/deployment-targets/{targetId}",
    "tags": [
      "Deployments"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "applicationId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ApplicationId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "targetId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/TargetId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/DeploymentTarget"
        ],
        "description": "Updated deployment target."
      }
    ],
    "summary": "Update a deployment target",
    "operationId": "updateDeploymentTarget",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/DeploymentTargetInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        },
        "targetId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/DeploymentTargetInput",
          "type": "object",
          "description": "Complete deployment target create/update payload used by the console, CLI, and Agent. Repository sources require repositoryBindingId; image sources require imageRef. Omitted optional fields use platform defaults.",
          "properties": {
            "affinity": {
              "type": "string",
              "description": "JSON Kubernetes affinity object."
            },
            "allowPrivilegeEscalation": {
              "type": "string",
              "description": "Tri-state string; empty inherits the platform default.",
              "enum": [
                "",
                "true",
                "false"
              ]
            },
            "autoDeploy": {
              "type": "boolean",
              "default": false
            },
            "automountServiceAccountToken": {
              "type": "string",
              "description": "Tri-state string controlling ServiceAccount token mounting; empty uses the Kubernetes default.",
              "enum": [
                "",
                "true",
                "false"
              ]
            },
            "autoScalingBehavior": {
              "type": "string",
              "description": "JSON Kubernetes horizontal pod autoscaler behavior object."
            },
            "autoScalingCpuPercent": {
              "type": "integer",
              "minimum": 0,
              "maximum": 1000
            },
            "autoScalingEnabled": {
              "type": "boolean",
              "default": false
            },
            "autoScalingMaxReplicas": {
              "type": "integer",
              "minimum": 1
            },
            "autoScalingMemoryPercent": {
              "type": "integer",
              "minimum": 0,
              "maximum": 1000
            },
            "autoScalingMinReplicas": {
              "type": "integer",
              "minimum": 1
            },
            "branchPattern": {
              "type": "string"
            },
            "buildArgs": {
              "type": "string",
              "description": "Newline-separated Docker build arguments in KEY=value form."
            },
            "buildContext": {
              "type": "string",
              "default": "."
            },
            "buildCpuRequest": {
              "type": "string",
              "default": "2"
            },
            "buildDefinitionMode": {
              "type": "string",
              "description": "Selects the repository Dockerfile or a platform-rendered template Dockerfile.",
              "enum": [
                "repository_dockerfile",
                "template"
              ],
              "default": "repository_dockerfile"
            },
            "buildDirectory": {
              "type": "string",
              "description": "Optional working directory within the build context."
            },
            "buildEnvironmentId": {
              "type": "string",
              "description": "Optional reusable build environment reference."
            },
            "buildHookBindings": {
              "type": "array",
              "items": {
                "type": "object",
                "required": [
                  "hookConfigId",
                  "phase"
                ],
                "properties": {
                  "hookConfigId": {
                    "type": "string"
                  },
                  "phase": {
                    "type": "string"
                  },
                  "runOrder": {
                    "type": "integer",
                    "minimum": 0
                  }
                },
                "additionalProperties": false
              }
            },
            "buildHooksEnabled": {
              "type": "boolean",
              "default": true
            },
            "buildLabels": {
              "type": "string",
              "description": "Comma-separated build selector labels."
            },
            "buildMemoryRequest": {
              "type": "string",
              "default": "4Gi"
            },
            "buildSecrets": {
              "type": "object",
              "description": "Optional deployment-level secret updates. Existing keys with an empty value are retained; omitted keys are removed. Values are encrypted and never returned.",
              "writeOnly": true,
              "additionalProperties": {
                "type": "string"
              }
            },
            "buildTemplateId": {
              "type": "string",
              "description": "Required when buildDefinitionMode is template."
            },
            "buildTemplateValues": {
              "type": "string",
              "description": "JSON object containing validated template parameters."
            },
            "buildTemplateVersion": {
              "type": "string",
              "description": "Immutable built-in template version. An empty value selects the current version."
            },
            "buildTimeoutSeconds": {
              "type": "integer",
              "default": 1800,
              "minimum": 60,
              "maximum": 86400
            },
            "buildVariables": {
              "type": "object",
              "description": "Optional deployment-level values that override matching application, project, and global keys.",
              "additionalProperties": {
                "type": "string"
              }
            },
            "buildVariableSetIds": {
              "type": "array",
              "description": "Project build variable set IDs.",
              "items": {
                "type": "string"
              }
            },
            "capabilityAdd": {
              "type": "string",
              "description": "JSON string array or line-separated Linux capabilities to add."
            },
            "capabilityDrop": {
              "type": "string",
              "description": "JSON string array or line-separated Linux capabilities to drop."
            },
            "clusterId": {
              "type": "string",
              "description": "Runtime cluster ID available to the project. Empty selects the platform default cluster."
            },
            "concurrencyPolicy": {
              "type": "string",
              "enum": [
                "queue",
                "parallel"
              ],
              "default": "queue"
            },
            "configFiles": {
              "type": "string",
              "description": "JSON array of runtime configuration file mounts."
            },
            "configRefs": {
              "type": "string",
              "description": "Serialized runtime ConfigMap references."
            },
            "containerArgs": {
              "type": "string",
              "description": "JSON string array or line-separated container arguments."
            },
            "containerCommand": {
              "type": "string",
              "description": "JSON string array or line-separated container command."
            },
            "cpuLimit": {
              "type": "string",
              "description": "Optional Kubernetes CPU limit."
            },
            "cpuRequest": {
              "type": "string",
              "description": "Kubernetes CPU quantity for each replica.",
              "default": "1"
            },
            "dataAccessMode": {
              "type": "string",
              "enum": [
                "ReadWriteOnce",
                "ReadOnlyMany",
                "ReadWriteMany"
              ]
            },
            "dataCapacity": {
              "type": "string",
              "default": "1Gi"
            },
            "dataMountPath": {
              "type": "string",
              "default": "/data"
            },
            "dataRetentionEnabled": {
              "type": "boolean",
              "default": false
            },
            "dataStorageClassName": {
              "type": "string"
            },
            "dataVolumeMode": {
              "type": "string",
              "enum": [
                "Filesystem",
                "Block"
              ]
            },
            "dataVolumes": {
              "type": "string",
              "description": "JSON array of managed, existingClaim, or emptyDir data-volume objects."
            },
            "dockerfilePath": {
              "type": "string",
              "default": "Dockerfile"
            },
            "enabled": {
              "type": "boolean",
              "default": true
            },
            "environmentId": {
              "type": "string",
              "description": "Optional project environment reference."
            },
            "envVars": {
              "type": "string",
              "description": "JSON object or newline-separated runtime environment variables."
            },
            "fsGroup": {
              "type": "string",
              "pattern": "^[0-9]*$"
            },
            "fsGroupChangePolicy": {
              "type": "string",
              "enum": [
                "Always",
                "OnRootMismatch"
              ]
            },
            "imagePullPolicy": {
              "type": "string",
              "enum": [
                "Always",
                "IfNotPresent",
                "Never"
              ]
            },
            "imageRef": {
              "type": "string",
              "description": "Existing OCI image reference used when sourceType is image."
            },
            "initContainers": {
              "type": "string",
              "description": "JSON array of Kubernetes init containers."
            },
            "lifecycle": {
              "type": "string",
              "description": "JSON Kubernetes lifecycle object."
            },
            "livenessProbe": {
              "type": "string",
              "description": "JSON Kubernetes liveness probe."
            },
            "memoryLimit": {
              "type": "string",
              "description": "Optional Kubernetes memory limit."
            },
            "memoryRequest": {
              "type": "string",
              "description": "Kubernetes memory quantity for each replica.",
              "default": "1Gi"
            },
            "name": {
              "type": "string",
              "description": "Display name. Defaults to the normalized stage.",
              "maxLength": 120
            },
            "namespace": {
              "type": "string",
              "description": "Optional Kubernetes namespace override. Empty uses the project namespace."
            },
            "nodeSelector": {
              "type": "string",
              "description": "JSON object or key=value lines."
            },
            "priorityClassName": {
              "type": "string"
            },
            "readinessProbe": {
              "type": "string",
              "description": "JSON Kubernetes readiness probe."
            },
            "readOnlyRootFilesystem": {
              "type": "boolean",
              "default": false
            },
            "replicas": {
              "type": "integer",
              "default": 1,
              "minimum": 1
            },
            "repositoryBindingId": {
              "type": "string",
              "description": "Required when sourceType is repository; must belong to the same application."
            },
            "requireApproval": {
              "type": "boolean",
              "default": false
            },
            "runAsGroup": {
              "type": "string",
              "pattern": "^[0-9]*$"
            },
            "runAsUser": {
              "type": "string",
              "pattern": "^[0-9]*$"
            },
            "runtimeConfigRefs": {
              "type": "array",
              "items": {
                "type": "object",
                "required": [
                  "setId"
                ],
                "properties": {
                  "mode": {
                    "type": "string",
                    "enum": [
                      "live",
                      "snapshot"
                    ],
                    "default": "live"
                  },
                  "setId": {
                    "type": "string"
                  }
                },
                "additionalProperties": false
              }
            },
            "runtimeConfigSetIds": {
              "type": "array",
              "description": "Legacy shorthand for live runtime configuration references.",
              "items": {
                "type": "string"
              }
            },
            "secretFiles": {
              "type": "string",
              "description": "JSON array of runtime secret file inputs. Existing plaintext values are never returned.",
              "writeOnly": true
            },
            "secretRefs": {
              "type": "string",
              "description": "Serialized runtime Secret references; plaintext secret values are not accepted here."
            },
            "serviceAccountName": {
              "type": "string",
              "description": "Optional Kubernetes ServiceAccount name used by the workload Pods.",
              "maxLength": 253,
              "pattern": "^$|^[a-z0-9]([-a-z0-9.]*[a-z0-9])?$"
            },
            "serviceAnnotations": {
              "type": "string",
              "description": "JSON object or key=value lines."
            },
            "serviceExternalTrafficPolicy": {
              "type": "string",
              "enum": [
                "Cluster",
                "Local"
              ]
            },
            "servicePort": {
              "type": "integer",
              "description": "Legacy single-port fallback used when servicePorts is empty.",
              "default": 8080,
              "minimum": 1,
              "maximum": 65535
            },
            "servicePorts": {
              "type": "array",
              "description": "Unique container service ports.",
              "items": {
                "type": "object",
                "required": [
                  "port"
                ],
                "properties": {
                  "appProtocol": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  },
                  "port": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 65535
                  }
                },
                "additionalProperties": false
              },
              "maxItems": 16
            },
            "serviceSessionAffinity": {
              "type": "string",
              "enum": [
                "None",
                "ClientIP"
              ]
            },
            "serviceType": {
              "type": "string",
              "enum": [
                "ClusterIP",
                "NodePort",
                "LoadBalancer"
              ]
            },
            "sidecarContainers": {
              "type": "string",
              "description": "JSON array of Kubernetes sidecar containers."
            },
            "sourceType": {
              "type": "string",
              "description": "Repository builds source code; image deploys an existing image directly.",
              "enum": [
                "repository",
                "image"
              ]
            },
            "stage": {
              "type": "string",
              "description": "Immutable stage identifier, unique among active deployment targets in the application. It may be reused after deletion cleanup.",
              "enum": [
                "dev",
                "test",
                "staging",
                "prod"
              ],
              "default": "dev"
            },
            "startupProbe": {
              "type": "string",
              "description": "JSON Kubernetes startup probe."
            },
            "tagPattern": {
              "type": "string"
            },
            "targetImageRef": {
              "type": "string",
              "description": "Combined target repository and tag for repository builds."
            },
            "targetRegistryId": {
              "type": "string",
              "description": "Registry credential used to push repository builds."
            },
            "targetRepository": {
              "type": "string"
            },
            "targetTag": {
              "type": "string",
              "default": "latest"
            },
            "tolerations": {
              "type": "string",
              "description": "JSON Kubernetes toleration array."
            },
            "topologySpreadConstraints": {
              "type": "string",
              "description": "JSON Kubernetes topology spread constraint array."
            },
            "webConsoleEnabled": {
              "type": [
                "boolean",
                "null"
              ],
              "description": "`null` inherits the project-space master switch and `false` disables Web Console for this deployment target.",
              "default": null
            },
            "workloadType": {
              "type": "string",
              "enum": [
                "Deployment",
                "StatefulSet"
              ],
              "default": "Deployment"
            }
          },
          "additionalProperties": false
        }
      },
      "required": [
        "applicationId",
        "body",
        "projectId",
        "targetId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/projects/{projectId}/applications/{applicationId}/deployment-targets/{targetId}",
    "tags": [
      "Deployments"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "applicationId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ApplicationId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "targetId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/TargetId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Deployment target deletion accepted and queued for asynchronous runtime cleanup."
      }
    ],
    "summary": "Delete a deployment target",
    "operationId": "deleteDeploymentTarget",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        },
        "targetId": {
          "type": "string"
        }
      },
      "required": [
        "applicationId",
        "projectId",
        "targetId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/applications/{applicationId}/deployment-targets/{targetId}/data-export",
    "tags": [
      "Deployments"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      },
      {
        "BearerToken": []
      }
    ],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "applicationId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ApplicationId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "targetId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/TargetId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "ticket",
        "in": "query",
        "required": true,
        "description": "One-time export ticket returned by the authorize endpoint. It expires after 60 seconds and is consumed even when its resource binding does not match.",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/gzip"
        ],
        "schemaRefs": [],
        "description": "Gzip-compressed tar archive streamed as an attachment."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Runtime data retention is disabled, the runtime cluster cannot export the target data, or the ticket is missing (`data_export.ticket_required`)."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Browser session or Luna CLI OAuth bearer is missing, invalid, expired, or revoked."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A personal access token was used (`mfa.session_required`), the OAuth grant lacks `deployment:data_export`, the role is insufficient, MFA is required, or the ticket is invalid/expired/consumed/bound to another request (`data_export.ticket_invalid`)."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Project, application, deployment target, or runtime dependency was not found."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The project, application, or deployment target is being deleted and cannot be exported."
      },
      {
        "status": "502",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The temporary export Pod or archive stream could not be started (`data_export.stream_failed`)."
      },
      {
        "status": "503",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The shared production ticket store is unavailable (`data_export.ticket_unavailable`)."
      }
    ],
    "summary": "Export persistent runtime data",
    "description": "Consumes a short-lived, one-time export ticket issued by the authorize endpoint, then repeats the interactive authentication-context, project Owner/Admin, resource-state, OAuth Scope, and `data_export` Step-up checks. Browser callers may use their session cookie and Luna CLI may use its OAuth bearer token; personal access tokens are rejected. Each export uses an isolated temporary Pod and streams a gzip archive without persisting the ticket or archive in business tables.",
    "operationId": "exportDeploymentTargetData",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        },
        "targetId": {
          "type": "string"
        },
        "ticket": {
          "type": "string"
        }
      },
      "required": [
        "applicationId",
        "projectId",
        "targetId",
        "ticket"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "classification": "protocol-adapter",
      "hidden": true,
      "exclusionReason": "Raw gzip download consumed by the explicit CLI data-export protocol adapter."
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/applications/{applicationId}/deployment-targets/{targetId}/data-export/authorize",
    "tags": [
      "Deployments"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      },
      {
        "BearerToken": []
      }
    ],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "applicationId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ApplicationId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "targetId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/TargetId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/DataExportAuthorization"
        ],
        "description": "Data-export ticket issued. The download endpoint still repeats authorization and atomically consumes the ticket."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Runtime data retention is disabled or the runtime cluster cannot export the target data."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Browser session or Luna CLI OAuth bearer is missing, invalid, expired, or revoked."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Project role is insufficient, the OAuth grant lacks `deployment:data_export`, a personal access token was used, or `data_export` Step-up verification is required."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Project, application, deployment target, or runtime dependency was not found."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Project, application, or deployment target is being deleted."
      },
      {
        "status": "503",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The shared production ticket store is unavailable (`data_export.ticket_unavailable`)."
      }
    ],
    "summary": "Authorize a persistent runtime data export",
    "description": "Requires a browser session or Luna CLI OAuth bearer, project Owner/Admin membership, a mutable project/application/deployment target, exportable runtime data, and an active `data_export` Step-up assertion when the global policy is enabled. OAuth callers also require `deployment:data_export`; personal access tokens are rejected. Returns a random 60-second one-time ticket bound to the current user, authentication context, project, application, and deployment target. Production uses the shared Redis ticket store and fails closed when Redis is unavailable.",
    "operationId": "authorizeDeploymentTargetDataExport",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        },
        "targetId": {
          "type": "string"
        }
      },
      "required": [
        "applicationId",
        "projectId",
        "targetId"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "classification": "protocol-adapter",
      "hidden": true,
      "exclusionReason": "Low-level one-time-ticket preflight consumed by the explicit CLI data-export protocol adapter."
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/releases/{releaseId}/terminal/authorize",
    "tags": [
      "Deployments"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      },
      {
        "BearerToken": []
      }
    ],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "releaseId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ReleaseId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/RuntimeTerminalAuthorization"
        ],
        "description": "One-time terminal ticket issued. The WebSocket endpoint must still atomically consume it and repeat authorization checks."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Browser session or Luna CLI OAuth bearer is missing, invalid, expired, or revoked."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Project role is insufficient, Web Console is disabled (`runtime.web_console_disabled`), a personal access token was used (`mfa.session_required`), or Step-up verification is required (`mfa_required` with purpose `runtime_terminal`)."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Project, release, or deployment target was not found."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Project or deployment target is being deleted and cannot open Web Console."
      },
      {
        "status": "503",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The shared production terminal-ticket store is unavailable (`runtime_terminal.ticket_unavailable`)."
      }
    ],
    "summary": "Authorize a release Web Console terminal connection",
    "description": "Normal HTTP preflight used before opening the release terminal WebSocket. Browser callers may use their existing session cookie; Luna CLI may use its OAuth bearer token when an active `runtime_terminal` Step-up assertion already exists. Personal access tokens are rejected. The response contains a short-lived random one-time ticket bound to the user, browser session or Luna CLI OAuth grant, assertion, project, release, deployment target, cluster, and namespace. The WebSocket passes this ticket in its query string, consumes it atomically, repeats all authorization checks before upgrading, and revalidates identity, membership, role, resource state, Web Console policy, and assertion every three seconds while connected. Browser WebSockets that omit a ticket retain the existing cookie-based flow. Revocation or expiry closes the shell.",
    "operationId": "authorizeReleaseRuntimeTerminal",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "releaseId": {
          "type": "string"
        }
      },
      "required": [
        "projectId",
        "releaseId"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "classification": "protocol-adapter",
      "hidden": true,
      "exclusionReason": "Low-level terminal preflight consumed by the explicit CLI release-terminal protocol adapter."
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/applications/{applicationId}/deployment-targets/{targetId}/release-image-candidates",
    "tags": [
      "Applications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "applicationId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ApplicationId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "targetId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/TargetId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ReleaseImageCandidates"
        ],
        "description": "Release image candidates."
      }
    ],
    "summary": "List release image candidates",
    "description": "Reads tags from the target registry first and falls back to saved build records when the registry is unavailable.",
    "operationId": "listReleaseImageCandidates",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        },
        "targetId": {
          "type": "string"
        }
      },
      "required": [
        "applicationId",
        "projectId",
        "targetId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/repository-bindings",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Repository binding list."
      }
    ],
    "summary": "List repository bindings for a project",
    "operationId": "listRepositoryBindings",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        }
      },
      "required": [
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/repository-bindings",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "201",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Created repository binding."
      }
    ],
    "summary": "Bind an application to a Git repository",
    "operationId": "createRepositoryBinding",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/RepositoryBindingInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/RepositoryBindingInput",
          "type": "object",
          "required": [
            "applicationId",
            "gitAccountId",
            "owner",
            "repo"
          ],
          "properties": {
            "applicationId": {
              "type": "string"
            },
            "cloneUrl": {
              "type": "string"
            },
            "defaultBranch": {
              "type": "string"
            },
            "gitAccountId": {
              "type": "string"
            },
            "owner": {
              "type": "string"
            },
            "repo": {
              "type": "string"
            },
            "webhookEnabled": {
              "type": "boolean",
              "description": "Desired webhook configuration. Current webhook availability is observed from the Git provider."
            }
          }
        }
      },
      "required": [
        "body",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/projects/{projectId}/repository-bindings/{bindingId}",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "bindingId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/BindingId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Updated repository binding."
      }
    ],
    "summary": "Update repository binding",
    "operationId": "updateRepositoryBinding",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/RepositoryBindingInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "bindingId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/RepositoryBindingInput",
          "type": "object",
          "required": [
            "applicationId",
            "gitAccountId",
            "owner",
            "repo"
          ],
          "properties": {
            "applicationId": {
              "type": "string"
            },
            "cloneUrl": {
              "type": "string"
            },
            "defaultBranch": {
              "type": "string"
            },
            "gitAccountId": {
              "type": "string"
            },
            "owner": {
              "type": "string"
            },
            "repo": {
              "type": "string"
            },
            "webhookEnabled": {
              "type": "boolean",
              "description": "Desired webhook configuration. Current webhook availability is observed from the Git provider."
            }
          }
        }
      },
      "required": [
        "bindingId",
        "body",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/projects/{projectId}/repository-bindings/{bindingId}",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "bindingId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/BindingId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Deleted repository binding."
      }
    ],
    "summary": "Delete repository binding",
    "operationId": "deleteRepositoryBinding",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "bindingId": {
          "type": "string"
        }
      },
      "required": [
        "bindingId",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/repository-bindings/{bindingId}/webhook",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/ProjectId",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "bindingId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/BindingId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Created repository webhook."
      }
    ],
    "summary": "Create webhook for a repository binding",
    "operationId": "createRepositoryWebhook",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "bindingId": {
          "type": "string"
        }
      },
      "required": [
        "bindingId",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/access-tokens/scopes",
    "tags": [
      "AccessTokens"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AccessTokenScopeDefinition"
        ],
        "description": "Access-token scope catalog."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Authentication is required."
      }
    ],
    "summary": "List access-token scope definitions",
    "description": "Returns the canonical scope catalog and the current user's scope-creation constraints.",
    "operationId": "listAccessTokenScopes",
    "xLunaCli": {
      "command": "access-token.scope-list",
      "classification": "business-command",
      "risk": "low",
      "requiredScopes": [
        "token:manage"
      ]
    }
  },
  {
    "method": "get",
    "path": "/api/v1/access-tokens",
    "tags": [
      "AccessTokens"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "ref": "#/components/parameters/Page",
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "ref": "#/components/parameters/PageSize",
        "schema": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        }
      },
      {
        "name": "sortBy",
        "in": "query",
        "schema": {
          "type": "string",
          "enum": [
            "createdAt",
            "expiresAt",
            "name",
            "scope",
            "status"
          ],
          "default": "createdAt"
        }
      },
      {
        "name": "sortOrder",
        "in": "query",
        "ref": "#/components/parameters/SortOrder",
        "schema": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "default": "desc"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Paginated access token list."
      }
    ],
    "summary": "List access tokens",
    "description": "Returns only non-revoked access tokens.",
    "operationId": "listAccessTokens",
    "inputSchema": {
      "type": "object",
      "properties": {
        "page": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        },
        "pageSize": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        },
        "sortBy": {
          "type": "string",
          "enum": [
            "createdAt",
            "expiresAt",
            "name",
            "scope",
            "status"
          ],
          "default": "createdAt"
        },
        "sortOrder": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "default": "desc"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/access-tokens",
    "tags": [
      "AccessTokens"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Created access token with one-time secret."
      }
    ],
    "summary": "Create access token",
    "operationId": "createAccessToken",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/AccessTokenInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/AccessTokenInput",
          "type": "object",
          "required": [
            "name",
            "scope"
          ],
          "properties": {
            "expiresInDays": {
              "type": "integer",
              "description": "0 means never expires.",
              "enum": [
                0,
                7,
                15,
                30,
                90
              ]
            },
            "name": {
              "type": "string"
            },
            "scope": {
              "type": "string",
              "description": "Comma-separated scopes. Wildcard and unknown scopes are rejected. Normal users can create read scopes only."
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/access-tokens/{tokenId}",
    "tags": [
      "AccessTokens"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "tokenId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/TokenId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Revoked access token."
      }
    ],
    "summary": "Revoke access token",
    "operationId": "revokeAccessToken",
    "inputSchema": {
      "type": "object",
      "properties": {
        "tokenId": {
          "type": "string"
        }
      },
      "required": [
        "tokenId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/auth/oidc/callback-url",
    "tags": [
      "Auth"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Get OIDCCallback URL",
    "operationId": "getOIDCCallbackURL"
  },
  {
    "method": "get",
    "path": "/api/v1/oauth/applications",
    "tags": [
      "OAuthApplications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/PaginatedOAuthApplications"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List OAuth Applications",
    "operationId": "listOAuthApplications"
  },
  {
    "method": "post",
    "path": "/api/v1/oauth/applications",
    "tags": [
      "OAuthApplications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/OAuthApplication"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Create OAuth Application",
    "operationId": "createOAuthApplication",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/OAuthApplicationInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/OAuthApplicationInput",
          "type": "object",
          "required": [
            "name",
            "redirectUris"
          ],
          "properties": {
            "accessTokenLifetimeDays": {
              "type": "integer",
              "description": "Zero configures a non-expiring access token.",
              "minimum": 0
            },
            "allowedScopes": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "description": {
              "type": "string"
            },
            "homepageUrl": {
              "type": "string",
              "format": "uri"
            },
            "logoUrl": {
              "type": "string",
              "format": "uri"
            },
            "name": {
              "type": "string",
              "minLength": 1
            },
            "redirectUris": {
              "type": "array",
              "items": {
                "type": "string",
                "format": "uri"
              },
              "minItems": 1
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/oauth/applications/{applicationId}",
    "tags": [
      "OAuthApplications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "applicationId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/OAuthApplication"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Update OAuth Application",
    "operationId": "updateOAuthApplication",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/OAuthApplicationInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "applicationId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/OAuthApplicationInput",
          "type": "object",
          "required": [
            "name",
            "redirectUris"
          ],
          "properties": {
            "accessTokenLifetimeDays": {
              "type": "integer",
              "description": "Zero configures a non-expiring access token.",
              "minimum": 0
            },
            "allowedScopes": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "description": {
              "type": "string"
            },
            "homepageUrl": {
              "type": "string",
              "format": "uri"
            },
            "logoUrl": {
              "type": "string",
              "format": "uri"
            },
            "name": {
              "type": "string",
              "minLength": 1
            },
            "redirectUris": {
              "type": "array",
              "items": {
                "type": "string",
                "format": "uri"
              },
              "minItems": 1
            }
          }
        }
      },
      "required": [
        "applicationId",
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/oauth/applications/{applicationId}",
    "tags": [
      "OAuthApplications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "applicationId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Resource deleted."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Delete OAuth Application",
    "operationId": "deleteOAuthApplication",
    "inputSchema": {
      "type": "object",
      "properties": {
        "applicationId": {
          "type": "string"
        }
      },
      "required": [
        "applicationId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/oauth/applications/{applicationId}/rotate-secret",
    "tags": [
      "OAuthApplications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "applicationId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/OAuthApplicationSecretResponse"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Rotate OAuth Application Secret",
    "operationId": "rotateOAuthApplicationSecret",
    "inputSchema": {
      "type": "object",
      "properties": {
        "applicationId": {
          "type": "string"
        }
      },
      "required": [
        "applicationId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/oauth/grants",
    "tags": [
      "OAuthApplications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/PaginatedOAuthGrants"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List My OAuth Grants",
    "operationId": "listMyOAuthGrants"
  },
  {
    "method": "delete",
    "path": "/api/v1/oauth/grants/{grantId}",
    "tags": [
      "OAuthApplications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "grantId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Resource deleted."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Revoke My OAuth Grant",
    "operationId": "revokeMyOAuthGrant",
    "inputSchema": {
      "type": "object",
      "properties": {
        "grantId": {
          "type": "string"
        }
      },
      "required": [
        "grantId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/oauth/authorize",
    "tags": [
      "OAuthApplications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "client_id",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "redirect_uri",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "scope",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "state",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "code_challenge",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "code_challenge_method",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Get OAuth Authorization Request",
    "operationId": "getOAuthAuthorizationRequest",
    "inputSchema": {
      "type": "object",
      "properties": {
        "client_id": {
          "type": "string"
        },
        "redirect_uri": {
          "type": "string"
        },
        "scope": {
          "type": "string"
        },
        "state": {
          "type": "string"
        },
        "code_challenge": {
          "type": "string"
        },
        "code_challenge_method": {
          "type": "string"
        }
      },
      "required": [
        "client_id",
        "code_challenge",
        "code_challenge_method",
        "redirect_uri",
        "scope"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "hidden": true,
      "exclusionReason": "Protocol endpoint consumed by a browser, webhook, probe, stream, or terminal adapter instead of a regular CLI command."
    }
  },
  {
    "method": "post",
    "path": "/api/v1/oauth/authorize",
    "tags": [
      "OAuthApplications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Decide OAuth Authorization",
    "operationId": "decideOAuthAuthorization",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/OAuthAuthorizationDecisionInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/OAuthAuthorizationDecisionInput",
          "type": "object",
          "required": [
            "approved",
            "clientId",
            "redirectUri"
          ],
          "properties": {
            "approved": {
              "type": "boolean"
            },
            "clientId": {
              "type": "string"
            },
            "codeChallenge": {
              "type": "string"
            },
            "codeChallengeMethod": {
              "type": "string",
              "enum": [
                "S256"
              ]
            },
            "redirectUri": {
              "type": "string",
              "format": "uri"
            },
            "scope": {
              "type": "string"
            },
            "state": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "hidden": true,
      "exclusionReason": "Protocol endpoint consumed by a browser, webhook, probe, stream, or terminal adapter instead of a regular CLI command."
    }
  },
  {
    "method": "get",
    "path": "/api/v1/git/accounts/{accountId}/repositories/{owner}/{repo}/build-options",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "accountId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "owner",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "repo",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "ref",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Get Git Repository Build Options",
    "operationId": "getGitRepositoryBuildOptions",
    "inputSchema": {
      "type": "object",
      "properties": {
        "accountId": {
          "type": "string"
        },
        "owner": {
          "type": "string"
        },
        "repo": {
          "type": "string"
        },
        "ref": {
          "type": "string"
        }
      },
      "required": [
        "accountId",
        "owner",
        "repo"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/git/accounts/{accountId}/repositories/{owner}/{repo}/contents",
    "tags": [
      "Git"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "accountId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "owner",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "repo",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "path",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "ref",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/SystemComponentStatusResponse"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Git Contents",
    "operationId": "listGitContents",
    "inputSchema": {
      "type": "object",
      "properties": {
        "accountId": {
          "type": "string"
        },
        "owner": {
          "type": "string"
        },
        "repo": {
          "type": "string"
        },
        "path": {
          "type": "string"
        },
        "ref": {
          "type": "string"
        }
      },
      "required": [
        "accountId",
        "owner",
        "repo"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/registries/{registryId}/image-template-default",
    "tags": [
      "Registries"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "registryId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "projectId",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "applicationId",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "targetName",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "stage",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Get Registry Image Template Default",
    "operationId": "getRegistryImageTemplateDefault",
    "inputSchema": {
      "type": "object",
      "properties": {
        "registryId": {
          "type": "string"
        },
        "projectId": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        },
        "targetName": {
          "type": "string"
        },
        "stage": {
          "type": "string"
        }
      },
      "required": [
        "applicationId",
        "projectId",
        "registryId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/registries/{registryId}/repositories/search",
    "tags": [
      "Registries"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "registryId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "search",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/PaginatedBusinessObjects"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Search Registry Repositories",
    "operationId": "searchRegistryRepositories",
    "inputSchema": {
      "type": "object",
      "properties": {
        "registryId": {
          "type": "string"
        },
        "search": {
          "type": "string"
        },
        "page": {
          "type": "integer",
          "format": "int32"
        },
        "pageSize": {
          "type": "integer",
          "format": "int32"
        }
      },
      "required": [
        "registryId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/registries/{registryId}/repository-tags",
    "tags": [
      "Registries"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "registryId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "repository",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObjectList"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Registry Repository Tags",
    "operationId": "listRegistryRepositoryTags",
    "inputSchema": {
      "type": "object",
      "properties": {
        "registryId": {
          "type": "string"
        },
        "repository": {
          "type": "string"
        },
        "limit": {
          "type": "integer",
          "format": "int32"
        }
      },
      "required": [
        "registryId",
        "repository"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/build/variable-sets",
    "tags": [
      "Builds"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObjectList"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Build Variable Sets",
    "operationId": "listBuildVariableSets",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/build/variable-sets",
    "tags": [
      "Builds"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/SystemComponentInstallResponse"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Create Build Variable Set",
    "operationId": "createBuildVariableSet",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/BuildVariableSetInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/BuildVariableSetInput",
          "type": "object",
          "required": [
            "name"
          ],
          "properties": {
            "applicationId": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "enabled": {
              "type": "boolean"
            },
            "name": {
              "type": "string",
              "minLength": 1
            },
            "projectId": {
              "type": "string"
            },
            "scope": {
              "type": "string",
              "enum": [
                "global",
                "project",
                "application"
              ]
            },
            "secrets": {
              "type": "object",
              "writeOnly": true,
              "additionalProperties": {
                "type": "string"
              }
            },
            "variables": {
              "type": "object",
              "additionalProperties": {
                "type": "string"
              }
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/build/variable-sets/{setId}",
    "tags": [
      "Builds"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "setId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Update Build Variable Set",
    "operationId": "updateBuildVariableSet",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/BuildVariableSetInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "setId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/BuildVariableSetInput",
          "type": "object",
          "required": [
            "name"
          ],
          "properties": {
            "applicationId": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "enabled": {
              "type": "boolean"
            },
            "name": {
              "type": "string",
              "minLength": 1
            },
            "projectId": {
              "type": "string"
            },
            "scope": {
              "type": "string",
              "enum": [
                "global",
                "project",
                "application"
              ]
            },
            "secrets": {
              "type": "object",
              "writeOnly": true,
              "additionalProperties": {
                "type": "string"
              }
            },
            "variables": {
              "type": "object",
              "additionalProperties": {
                "type": "string"
              }
            }
          }
        }
      },
      "required": [
        "body",
        "setId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/build/variable-sets/{setId}",
    "tags": [
      "Builds"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "setId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Resource deleted."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Delete Build Variable Set",
    "operationId": "deleteBuildVariableSet",
    "inputSchema": {
      "type": "object",
      "properties": {
        "setId": {
          "type": "string"
        }
      },
      "required": [
        "setId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/runtime/clusters/{clusterId}",
    "tags": [
      "Runtime"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "clusterId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Update Runtime Cluster",
    "operationId": "updateRuntimeCluster",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/RuntimeClusterInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "clusterId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/RuntimeClusterInput",
          "type": "object",
          "required": [
            "endpoint",
            "name",
            "scope",
            "type"
          ],
          "properties": {
            "endpoint": {
              "type": "string"
            },
            "gatewayCertificateNamespace": {
              "type": "string"
            },
            "gatewayCertIssuerKind": {
              "type": "string",
              "enum": [
                "Issuer",
                "ClusterIssuer"
              ]
            },
            "gatewayCertIssuerName": {
              "type": "string"
            },
            "gatewayClassName": {
              "type": "string"
            },
            "gatewayControllerType": {
              "type": "string",
              "enum": [
                "traefik",
                "generic"
              ]
            },
            "gatewayDefaultRequestHeaders": {
              "type": "string"
            },
            "gatewayDefaultResponseHeaders": {
              "type": "string"
            },
            "gatewayDomainSuffixes": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "gatewayExternalTLSMode": {
              "type": "string",
              "enum": [
                "none",
                "gateway",
                "upstream"
              ]
            },
            "gatewayForwardedHeadersMode": {
              "type": "string",
              "enum": [
                "preserve",
                "overwrite",
                "none"
              ]
            },
            "gatewayHttpListenerName": {
              "type": "string"
            },
            "gatewayHttpListenerPort": {
              "type": "integer",
              "minimum": 1,
              "maximum": 65535
            },
            "gatewayHttpsListenerName": {
              "type": "string"
            },
            "gatewayHttpsListenerPort": {
              "type": "integer",
              "minimum": 1,
              "maximum": 65535
            },
            "gatewayName": {
              "type": "string"
            },
            "gatewayNamespace": {
              "type": "string"
            },
            "gatewayProvider": {
              "type": "string",
              "enum": [
                "gateway-api"
              ]
            },
            "gatewayPublicPort": {
              "type": "integer",
              "minimum": 1,
              "maximum": 65535
            },
            "gatewayPublicScheme": {
              "type": "string",
              "enum": [
                "http",
                "https"
              ]
            },
            "gatewayRootDomain": {
              "type": "string"
            },
            "gatewayTlsSecretName": {
              "type": "string"
            },
            "gatewayTlsSecretNamespace": {
              "type": "string"
            },
            "gatewayTrustedProxyCIDRs": {
              "type": "string"
            },
            "gatewayWildcardCertDomain": {
              "type": "string"
            },
            "gatewayWildcardCertEnabled": {
              "type": "boolean"
            },
            "gatewayWildcardCertSecretName": {
              "type": "string"
            },
            "isDefault": {
              "type": "boolean"
            },
            "kubeconfig": {
              "type": "string",
              "writeOnly": true
            },
            "maxConcurrentBuilds": {
              "type": "integer",
              "minimum": 1
            },
            "name": {
              "type": "string",
              "minLength": 1
            },
            "ownerRef": {
              "type": "string"
            },
            "projectIds": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "scope": {
              "type": "string",
              "enum": [
                "global",
                "project",
                "user"
              ]
            },
            "status": {
              "type": "string"
            },
            "type": {
              "type": "string",
              "enum": [
                "kubernetes",
                "k3s"
              ]
            }
          }
        }
      },
      "required": [
        "body",
        "clusterId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/runtime/clusters/{clusterId}",
    "tags": [
      "Runtime"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "clusterId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Resource deleted."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Delete Runtime Cluster",
    "operationId": "deleteRuntimeCluster",
    "inputSchema": {
      "type": "object",
      "properties": {
        "clusterId": {
          "type": "string"
        }
      },
      "required": [
        "clusterId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/runtime/clusters/{clusterId}/test",
    "tags": [
      "Runtime"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "clusterId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Test Runtime Cluster",
    "operationId": "testRuntimeCluster",
    "inputSchema": {
      "type": "object",
      "properties": {
        "clusterId": {
          "type": "string"
        }
      },
      "required": [
        "clusterId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/runtime/clusters/{clusterId}/resources",
    "tags": [
      "Runtime"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "clusterId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "kind",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "namespace",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "projectId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "applicationId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "environmentId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObjectList"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Runtime Cluster Resources",
    "operationId": "listRuntimeClusterResources",
    "inputSchema": {
      "type": "object",
      "properties": {
        "clusterId": {
          "type": "string"
        },
        "kind": {
          "type": "string"
        },
        "namespace": {
          "type": "string"
        },
        "projectId": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        },
        "environmentId": {
          "type": "string"
        }
      },
      "required": [
        "clusterId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/runtime/clusters/{clusterId}/resources",
    "tags": [
      "Runtime"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "clusterId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "kind",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "namespace",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "name",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Resource deleted."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Delete Runtime Cluster Resource",
    "operationId": "deleteRuntimeClusterResource",
    "inputSchema": {
      "type": "object",
      "properties": {
        "clusterId": {
          "type": "string"
        },
        "kind": {
          "type": "string"
        },
        "namespace": {
          "type": "string"
        },
        "name": {
          "type": "string"
        }
      },
      "required": [
        "clusterId",
        "kind",
        "name",
        "namespace"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/runtime/clusters/{clusterId}/resource-yaml",
    "tags": [
      "Runtime"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "clusterId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "kind",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "namespace",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "name",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Get Runtime Cluster Resource YAML",
    "operationId": "getRuntimeClusterResourceYAML",
    "inputSchema": {
      "type": "object",
      "properties": {
        "clusterId": {
          "type": "string"
        },
        "kind": {
          "type": "string"
        },
        "namespace": {
          "type": "string"
        },
        "name": {
          "type": "string"
        }
      },
      "required": [
        "clusterId",
        "kind",
        "name",
        "namespace"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/runtime/clusters/{clusterId}/resource-events",
    "tags": [
      "Runtime"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "clusterId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "kind",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "namespace",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "name",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Runtime Cluster Resource Events",
    "operationId": "listRuntimeClusterResourceEvents",
    "inputSchema": {
      "type": "object",
      "properties": {
        "clusterId": {
          "type": "string"
        },
        "kind": {
          "type": "string"
        },
        "namespace": {
          "type": "string"
        },
        "name": {
          "type": "string"
        }
      },
      "required": [
        "clusterId",
        "kind",
        "name",
        "namespace"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/runtime/clusters/{clusterId}/pods/terminal",
    "tags": [
      "Runtime"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "clusterId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "namespace",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "name",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "container",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "ticket",
        "in": "query",
        "required": false,
        "description": "Short-lived one-time ticket returned by `authorizeRuntimeClusterPodTerminal`. Required for Luna CLI; omitted by the existing browser cookie flow.",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "101",
        "contentTypes": [
          "text/plain"
        ],
        "schemaRefs": [],
        "description": "WebSocket protocol switch accepted after the ticket or browser session is authorized."
      }
    ],
    "summary": "Stream Runtime Cluster Pod Terminal",
    "description": "Opens the Pod terminal WebSocket. Luna CLI passes the short-lived one-time ticket returned by the authorize endpoint in the `ticket` query parameter; browser callers may omit it and continue using the existing session-cookie flow.",
    "operationId": "streamRuntimeClusterPodTerminal",
    "inputSchema": {
      "type": "object",
      "properties": {
        "clusterId": {
          "type": "string"
        },
        "namespace": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "container": {
          "type": "string"
        },
        "ticket": {
          "type": "string"
        }
      },
      "required": [
        "clusterId",
        "name",
        "namespace"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "classification": "protocol-adapter",
      "hidden": true,
      "exclusionReason": "WebSocket terminal transport consumed by the explicit CLI runtime-terminal protocol adapter."
    }
  },
  {
    "method": "get",
    "path": "/api/v1/system-components",
    "tags": [
      "System"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "componentId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "clusterId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObjectList"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List System Components",
    "operationId": "listSystemComponents",
    "inputSchema": {
      "type": "object",
      "properties": {
        "componentId": {
          "type": "string"
        },
        "clusterId": {
          "type": "string"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/app-templates/{templateId}/system-install",
    "tags": [
      "AppTemplates"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "templateId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Install System App Template",
    "operationId": "installSystemAppTemplate",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/SystemComponentInstallInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "templateId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/SystemComponentInstallInput",
          "type": "object",
          "required": [
            "apiBaseUrl",
            "clusterId"
          ],
          "properties": {
            "apiBaseUrl": {
              "type": "string",
              "format": "uri"
            },
            "clusterId": {
              "type": "string"
            },
            "mode": {
              "type": "string"
            },
            "namespace": {
              "type": "string"
            },
            "traefikMetricsUrl": {
              "type": "string",
              "format": "uri"
            }
          }
        }
      },
      "required": [
        "body",
        "templateId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/notifications/presets",
    "tags": [
      "Notifications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObjectList"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Notification Presets",
    "operationId": "listNotificationPresets"
  },
  {
    "method": "post",
    "path": "/api/v1/notifications/presets/{presetId}/channels",
    "tags": [
      "Notifications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "presetId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Create Notification Channel From Preset",
    "operationId": "createNotificationChannelFromPreset",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/NotificationPresetChannelInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "presetId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/NotificationPresetChannelInput",
          "type": "object",
          "required": [
            "name"
          ],
          "properties": {
            "enabled": {
              "type": "boolean"
            },
            "name": {
              "type": "string",
              "minLength": 1
            },
            "secrets": {
              "type": "object",
              "writeOnly": true,
              "additionalProperties": {
                "type": "string"
              }
            }
          }
        }
      },
      "required": [
        "body",
        "presetId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/notifications/channels",
    "tags": [
      "Notifications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "search",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/PaginatedBusinessObjects"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Notification Channels",
    "operationId": "listNotificationChannels",
    "inputSchema": {
      "type": "object",
      "properties": {
        "search": {
          "type": "string"
        },
        "page": {
          "type": "integer",
          "format": "int32"
        },
        "pageSize": {
          "type": "integer",
          "format": "int32"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/notifications/channels",
    "tags": [
      "Notifications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Create Notification Channel",
    "operationId": "createNotificationChannel",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/NotificationChannelInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/NotificationChannelInput",
          "type": "object",
          "required": [
            "adapterKind",
            "name"
          ],
          "properties": {
            "adapterKind": {
              "type": "string"
            },
            "config": {
              "type": "object",
              "additionalProperties": true
            },
            "enabled": {
              "type": "boolean"
            },
            "name": {
              "type": "string",
              "minLength": 1
            },
            "secrets": {
              "type": "object",
              "writeOnly": true,
              "additionalProperties": {
                "type": "string"
              }
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/notifications/channels/{channelId}",
    "tags": [
      "Notifications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "channelId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Update Notification Channel",
    "operationId": "updateNotificationChannel",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/NotificationChannelInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "channelId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/NotificationChannelInput",
          "type": "object",
          "required": [
            "adapterKind",
            "name"
          ],
          "properties": {
            "adapterKind": {
              "type": "string"
            },
            "config": {
              "type": "object",
              "additionalProperties": true
            },
            "enabled": {
              "type": "boolean"
            },
            "name": {
              "type": "string",
              "minLength": 1
            },
            "secrets": {
              "type": "object",
              "writeOnly": true,
              "additionalProperties": {
                "type": "string"
              }
            }
          }
        }
      },
      "required": [
        "body",
        "channelId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/notifications/channels/{channelId}",
    "tags": [
      "Notifications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "channelId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Resource deleted."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Delete Notification Channel",
    "operationId": "deleteNotificationChannel",
    "inputSchema": {
      "type": "object",
      "properties": {
        "channelId": {
          "type": "string"
        }
      },
      "required": [
        "channelId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/notifications/channels/{channelId}/test",
    "tags": [
      "Notifications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "channelId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Test Notification Channel",
    "operationId": "testNotificationChannel",
    "inputSchema": {
      "type": "object",
      "properties": {
        "channelId": {
          "type": "string"
        }
      },
      "required": [
        "channelId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/notifications/templates",
    "tags": [
      "Notifications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "eventType",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "adapterKind",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/PaginatedBusinessObjects"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Notification Templates",
    "operationId": "listNotificationTemplates",
    "inputSchema": {
      "type": "object",
      "properties": {
        "eventType": {
          "type": "string"
        },
        "adapterKind": {
          "type": "string"
        },
        "page": {
          "type": "integer",
          "format": "int32"
        },
        "pageSize": {
          "type": "integer",
          "format": "int32"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/notifications/templates",
    "tags": [
      "Notifications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Create Notification Template",
    "operationId": "createNotificationTemplate",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/NotificationTemplateInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/NotificationTemplateInput",
          "type": "object",
          "required": [
            "adapterKind",
            "eventType",
            "locale",
            "name"
          ],
          "properties": {
            "adapterKind": {
              "type": "string"
            },
            "bodyTemplate": {
              "type": "string"
            },
            "enabled": {
              "type": "boolean"
            },
            "eventType": {
              "type": "string"
            },
            "jsonBodyTemplate": {
              "type": "string"
            },
            "locale": {
              "type": "string"
            },
            "name": {
              "type": "string",
              "minLength": 1
            },
            "subjectTemplate": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/notifications/templates/{templateId}",
    "tags": [
      "Notifications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "templateId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Update Notification Template",
    "operationId": "updateNotificationTemplate",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/NotificationTemplateInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "templateId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/NotificationTemplateInput",
          "type": "object",
          "required": [
            "adapterKind",
            "eventType",
            "locale",
            "name"
          ],
          "properties": {
            "adapterKind": {
              "type": "string"
            },
            "bodyTemplate": {
              "type": "string"
            },
            "enabled": {
              "type": "boolean"
            },
            "eventType": {
              "type": "string"
            },
            "jsonBodyTemplate": {
              "type": "string"
            },
            "locale": {
              "type": "string"
            },
            "name": {
              "type": "string",
              "minLength": 1
            },
            "subjectTemplate": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body",
        "templateId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/notifications/templates/{templateId}",
    "tags": [
      "Notifications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "templateId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Resource deleted."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Delete Notification Template",
    "operationId": "deleteNotificationTemplate",
    "inputSchema": {
      "type": "object",
      "properties": {
        "templateId": {
          "type": "string"
        }
      },
      "required": [
        "templateId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/notifications/rules",
    "tags": [
      "Notifications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "search",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/PaginatedBusinessObjects"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Notification Rules",
    "operationId": "listNotificationRules",
    "inputSchema": {
      "type": "object",
      "properties": {
        "search": {
          "type": "string"
        },
        "page": {
          "type": "integer",
          "format": "int32"
        },
        "pageSize": {
          "type": "integer",
          "format": "int32"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/notifications/rules",
    "tags": [
      "Notifications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Create Notification Rule",
    "operationId": "createNotificationRule",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/NotificationRuleInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/NotificationRuleInput",
          "type": "object",
          "required": [
            "channelIds",
            "eventTypes",
            "name"
          ],
          "properties": {
            "channelIds": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "enabled": {
              "type": "boolean"
            },
            "eventTypes": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "filter": {
              "type": "object",
              "additionalProperties": true
            },
            "locale": {
              "type": "string"
            },
            "name": {
              "type": "string",
              "minLength": 1
            },
            "templateId": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/notifications/rules/{ruleId}",
    "tags": [
      "Notifications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "ruleId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Update Notification Rule",
    "operationId": "updateNotificationRule",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/NotificationRuleInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "ruleId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/NotificationRuleInput",
          "type": "object",
          "required": [
            "channelIds",
            "eventTypes",
            "name"
          ],
          "properties": {
            "channelIds": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "enabled": {
              "type": "boolean"
            },
            "eventTypes": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "filter": {
              "type": "object",
              "additionalProperties": true
            },
            "locale": {
              "type": "string"
            },
            "name": {
              "type": "string",
              "minLength": 1
            },
            "templateId": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body",
        "ruleId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/notifications/rules/{ruleId}",
    "tags": [
      "Notifications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "ruleId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Resource deleted."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Delete Notification Rule",
    "operationId": "deleteNotificationRule",
    "inputSchema": {
      "type": "object",
      "properties": {
        "ruleId": {
          "type": "string"
        }
      },
      "required": [
        "ruleId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/notifications/deliveries",
    "tags": [
      "Notifications"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "status",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "eventType",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/PaginatedBusinessObjects"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Notification Deliveries",
    "operationId": "listNotificationDeliveries",
    "inputSchema": {
      "type": "object",
      "properties": {
        "status": {
          "type": "string"
        },
        "eventType": {
          "type": "string"
        },
        "page": {
          "type": "integer",
          "format": "int32"
        },
        "pageSize": {
          "type": "integer",
          "format": "int32"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/inbox",
    "tags": [
      "Inbox"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      },
      {
        "BearerToken": []
      }
    ],
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "ref": "#/components/parameters/Page",
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "ref": "#/components/parameters/PageSize",
        "schema": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        }
      },
      {
        "name": "sortBy",
        "in": "query",
        "schema": {
          "type": "string",
          "enum": [
            "createdAt",
            "updatedAt",
            "priority"
          ],
          "default": "createdAt"
        }
      },
      {
        "name": "sortOrder",
        "in": "query",
        "ref": "#/components/parameters/SortOrder",
        "schema": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "default": "desc"
        }
      },
      {
        "name": "filter",
        "in": "query",
        "schema": {
          "type": "string",
          "enum": [
            "all",
            "unread",
            "action"
          ],
          "default": "all"
        }
      },
      {
        "name": "category",
        "in": "query",
        "schema": {
          "ref": "#/components/schemas/InboxCategory",
          "type": "string",
          "enum": [
            "action",
            "project",
            "billing",
            "security",
            "delivery",
            "system"
          ]
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/PaginatedInboxMessages"
        ],
        "description": "Paginated user-scoped inbox messages."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "500",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Inbox query failed."
      }
    ],
    "summary": "List the current user's inbox messages",
    "description": "Returns non-archived messages owned by the authenticated user. Read state and action-request state are independent.",
    "operationId": "listInboxMessages",
    "inputSchema": {
      "type": "object",
      "properties": {
        "page": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        },
        "pageSize": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        },
        "sortBy": {
          "type": "string",
          "enum": [
            "createdAt",
            "updatedAt",
            "priority"
          ],
          "default": "createdAt"
        },
        "sortOrder": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "default": "desc"
        },
        "filter": {
          "type": "string",
          "enum": [
            "all",
            "unread",
            "action"
          ],
          "default": "all"
        },
        "category": {
          "ref": "#/components/schemas/InboxCategory",
          "type": "string",
          "enum": [
            "action",
            "project",
            "billing",
            "security",
            "delivery",
            "system"
          ]
        }
      },
      "additionalProperties": false
    },
    "xLunaCli": {
      "hidden": true,
      "exclusionReason": "The first inbox experience is provided by the interactive web message center."
    }
  },
  {
    "method": "get",
    "path": "/api/v1/inbox/unread-count",
    "tags": [
      "Inbox"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      },
      {
        "BearerToken": []
      }
    ],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/InboxUnreadCount"
        ],
        "description": "Current unread count from the database fact source."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "500",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Inbox unread-count query failed."
      }
    ],
    "summary": "Get the current user's unread inbox count",
    "operationId": "getInboxUnreadCount",
    "xLunaCli": {
      "hidden": true,
      "exclusionReason": "The unread badge is consumed by the interactive web message center."
    }
  },
  {
    "method": "get",
    "path": "/api/v1/inbox/stream",
    "tags": [
      "Inbox"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "text/event-stream"
        ],
        "schemaRefs": [],
        "description": "Unbuffered SSE invalidation stream."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "500",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Inbox stream initialization failed."
      }
    ],
    "summary": "Stream inbox invalidation hints for the current user",
    "description": "Emits invalidation hints only. Clients must reload the list and unread count from the database-backed endpoints after every event or reconnect.",
    "operationId": "streamInboxChanges",
    "xLunaCli": {
      "hidden": true,
      "exclusionReason": "Browser EventSource transport for the interactive message center."
    }
  },
  {
    "method": "get",
    "path": "/api/v1/inbox/{messageId}",
    "tags": [
      "Inbox"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      },
      {
        "BearerToken": []
      }
    ],
    "parameters": [
      {
        "name": "messageId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/InboxMessageId",
        "schema": {
          "type": "string",
          "pattern": "^imsg_"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/InboxMessage"
        ],
        "description": "User-scoped inbox message."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      },
      {
        "status": "500",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Inbox message query failed."
      }
    ],
    "summary": "Get one inbox message owned by the current user",
    "operationId": "getInboxMessage",
    "inputSchema": {
      "type": "object",
      "properties": {
        "messageId": {
          "type": "string",
          "pattern": "^imsg_"
        }
      },
      "required": [
        "messageId"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "hidden": true,
      "exclusionReason": "Inbox message details are currently provided by the interactive web message center."
    }
  },
  {
    "method": "post",
    "path": "/api/v1/inbox/{messageId}/read",
    "tags": [
      "Inbox"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      },
      {
        "BearerToken": []
      }
    ],
    "parameters": [
      {
        "name": "messageId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/InboxMessageId",
        "schema": {
          "type": "string",
          "pattern": "^imsg_"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Message marked as read."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      },
      {
        "status": "500",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Inbox message update failed."
      }
    ],
    "summary": "Mark one current-user inbox message as read",
    "operationId": "markInboxMessageRead",
    "inputSchema": {
      "type": "object",
      "properties": {
        "messageId": {
          "type": "string",
          "pattern": "^imsg_"
        }
      },
      "required": [
        "messageId"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "hidden": true,
      "exclusionReason": "Inbox read state is currently managed by the interactive web message center."
    }
  },
  {
    "method": "post",
    "path": "/api/v1/inbox/read-all",
    "tags": [
      "Inbox"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      },
      {
        "BearerToken": []
      }
    ],
    "parameters": [],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "All visible messages marked as read."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "500",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Inbox message update failed."
      }
    ],
    "summary": "Mark all current-user inbox messages as read",
    "description": "This does not accept, reject, or otherwise mutate linked action requests.",
    "operationId": "markAllInboxMessagesRead",
    "xLunaCli": {
      "hidden": true,
      "exclusionReason": "Inbox read state is currently managed by the interactive web message center."
    }
  },
  {
    "method": "post",
    "path": "/api/v1/inbox/{messageId}/archive",
    "tags": [
      "Inbox"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      },
      {
        "BearerToken": []
      }
    ],
    "parameters": [
      {
        "name": "messageId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/InboxMessageId",
        "schema": {
          "type": "string",
          "pattern": "^imsg_"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Message archived."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      },
      {
        "status": "500",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Inbox message update failed."
      }
    ],
    "summary": "Archive one current-user inbox message",
    "description": "Archiving a message does not mutate its linked action request.",
    "operationId": "archiveInboxMessage",
    "inputSchema": {
      "type": "object",
      "properties": {
        "messageId": {
          "type": "string",
          "pattern": "^imsg_"
        }
      },
      "required": [
        "messageId"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "hidden": true,
      "exclusionReason": "Inbox archive state is currently managed by the interactive web message center."
    }
  },
  {
    "method": "post",
    "path": "/api/v1/inbox/action-requests/{requestId}/decision",
    "tags": [
      "Inbox"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      },
      {
        "BearerToken": []
      }
    ],
    "parameters": [
      {
        "name": "requestId",
        "in": "path",
        "required": true,
        "ref": "#/components/parameters/InboxRequestId",
        "schema": {
          "type": "string",
          "pattern": "^iar_"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/InboxActionRequestSummary"
        ],
        "description": "Updated action-request summary."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested state transition conflicts with the current durable state."
      },
      {
        "status": "410",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The action request has expired."
      },
      {
        "status": "500",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Action-request decision failed."
      },
      {
        "status": "503",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "No typed action-request decision handler is available."
      }
    ],
    "summary": "Accept or reject an inbox action request",
    "description": "Revalidates the recipient, request version, expiry, requester authorization, and current resource state before applying the typed business decision.",
    "operationId": "decideInboxActionRequest",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/InboxDecisionInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "requestId": {
          "type": "string",
          "pattern": "^iar_"
        },
        "body": {
          "ref": "#/components/schemas/InboxDecisionInput",
          "type": "object",
          "required": [
            "decision",
            "expectedVersion"
          ],
          "properties": {
            "decision": {
              "ref": "#/components/schemas/InboxDecision",
              "type": "string",
              "enum": [
                "accept",
                "reject"
              ]
            },
            "expectedVersion": {
              "type": "integer",
              "format": "int64",
              "minimum": 1
            }
          },
          "additionalProperties": false
        }
      },
      "required": [
        "body",
        "requestId"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "hidden": true,
      "exclusionReason": "Typed action requests currently require the interactive inbox confirmation workflow."
    }
  },
  {
    "method": "post",
    "path": "/api/v1/telemetry/v1/traces",
    "tags": [
      "Telemetry"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Trace payload accepted, or server-side browser telemetry is disabled."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "413",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Trace payload exceeds the one MiB relay limit."
      },
      {
        "status": "415",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "OTLP protobuf content type is required."
      },
      {
        "status": "429",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Per-user browser telemetry rate limit exceeded."
      },
      {
        "status": "503",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Telemetry rate limiting or collector relay is unavailable."
      }
    ],
    "summary": "Relay authenticated browser OTLP traces",
    "description": "Accepts an OTLP/HTTP protobuf payload from the signed-in web client and relays it to the server-configured collector without exposing collector credentials or topology.",
    "operationId": "relayBrowserTraces",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/x-protobuf"
      ],
      "schemaRefs": []
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "type": "string",
          "format": "binary"
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "classification": "internal-observability",
      "hidden": true,
      "agentAllowed": false,
      "exclusionReason": "Browser telemetry ingestion transport is not a user business command."
    }
  },
  {
    "method": "get",
    "path": "/api/v1/events",
    "tags": [
      "Events"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "scope",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "search",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "projectId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      {
        "name": "applicationId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      {
        "name": "deploymentTargetId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      {
        "name": "category",
        "in": "query",
        "required": false,
        "schema": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      {
        "name": "type",
        "in": "query",
        "required": false,
        "schema": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      {
        "name": "severity",
        "in": "query",
        "required": false,
        "schema": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      {
        "name": "status",
        "in": "query",
        "required": false,
        "schema": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      {
        "name": "dateFrom",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "dateTo",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      },
      {
        "name": "sortBy",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "sortOrder",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/PaginatedBusinessObjects"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Platform Events",
    "operationId": "listPlatformEvents",
    "inputSchema": {
      "type": "object",
      "properties": {
        "scope": {
          "type": "string"
        },
        "search": {
          "type": "string"
        },
        "projectId": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "applicationId": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "deploymentTargetId": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "category": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "type": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "severity": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "status": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "dateFrom": {
          "type": "string"
        },
        "dateTo": {
          "type": "string"
        },
        "page": {
          "type": "integer",
          "format": "int32"
        },
        "pageSize": {
          "type": "integer",
          "format": "int32"
        },
        "sortBy": {
          "type": "string"
        },
        "sortOrder": {
          "type": "string"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/events/catalog",
    "tags": [
      "Events"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObjectList"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Platform Event Catalog",
    "operationId": "listPlatformEventCatalog"
  },
  {
    "method": "get",
    "path": "/api/v1/events/{eventId}",
    "tags": [
      "Events"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "eventId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Get Platform Event",
    "operationId": "getPlatformEvent",
    "inputSchema": {
      "type": "object",
      "properties": {
        "eventId": {
          "type": "string"
        }
      },
      "required": [
        "eventId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/app-templates",
    "tags": [
      "AppTemplates"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObjectList"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List App Templates",
    "operationId": "listAppTemplates"
  },
  {
    "method": "put",
    "path": "/api/v1/projects/order",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Update Project Order",
    "operationId": "updateProjectOrder",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/ProjectOrderInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/ProjectOrderInput",
          "type": "object",
          "required": [
            "projectIds"
          ],
          "properties": {
            "projectIds": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/runtime-config-sets",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObjectList"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Project Runtime Config Sets",
    "operationId": "listProjectRuntimeConfigSets",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        }
      },
      "required": [
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/runtime-config-sets",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Create Project Runtime Config Set",
    "operationId": "createProjectRuntimeConfigSet",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/ProjectRuntimeConfigSetInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/ProjectRuntimeConfigSetInput",
          "type": "object",
          "required": [
            "name"
          ],
          "properties": {
            "configFiles": {
              "type": "string"
            },
            "enabled": {
              "type": "boolean"
            },
            "envVars": {
              "type": "string"
            },
            "name": {
              "type": "string",
              "minLength": 1
            },
            "secretFiles": {
              "type": "string"
            },
            "secretRefs": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/projects/{projectId}/runtime-config-sets/{setId}",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "setId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Update Project Runtime Config Set",
    "operationId": "updateProjectRuntimeConfigSet",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/ProjectRuntimeConfigSetInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "setId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/ProjectRuntimeConfigSetInput",
          "type": "object",
          "required": [
            "name"
          ],
          "properties": {
            "configFiles": {
              "type": "string"
            },
            "enabled": {
              "type": "boolean"
            },
            "envVars": {
              "type": "string"
            },
            "name": {
              "type": "string",
              "minLength": 1
            },
            "secretFiles": {
              "type": "string"
            },
            "secretRefs": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body",
        "projectId",
        "setId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/projects/{projectId}/runtime-config-sets/{setId}",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "setId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Resource deleted."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Delete Project Runtime Config Set",
    "operationId": "deleteProjectRuntimeConfigSet",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "setId": {
          "type": "string"
        }
      },
      "required": [
        "projectId",
        "setId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/hooks",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObjectList"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Project Hook Configs",
    "operationId": "listProjectHookConfigs",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        }
      },
      "required": [
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/hooks",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Create Project Hook Config",
    "operationId": "createProjectHookConfig",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/ProjectHookConfigInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/ProjectHookConfigInput",
          "type": "object",
          "required": [
            "name",
            "script"
          ],
          "properties": {
            "enabled": {
              "type": "boolean"
            },
            "failurePolicy": {
              "type": "string",
              "enum": [
                "fail",
                "continue"
              ]
            },
            "name": {
              "type": "string",
              "minLength": 1
            },
            "script": {
              "type": "string"
            },
            "shell": {
              "type": "string"
            },
            "timeoutSeconds": {
              "type": "integer",
              "minimum": 1
            }
          }
        }
      },
      "required": [
        "body",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/projects/{projectId}/hooks/{hookId}",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "hookId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Update Project Hook Config",
    "operationId": "updateProjectHookConfig",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/ProjectHookConfigInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "hookId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/ProjectHookConfigInput",
          "type": "object",
          "required": [
            "name",
            "script"
          ],
          "properties": {
            "enabled": {
              "type": "boolean"
            },
            "failurePolicy": {
              "type": "string",
              "enum": [
                "fail",
                "continue"
              ]
            },
            "name": {
              "type": "string",
              "minLength": 1
            },
            "script": {
              "type": "string"
            },
            "shell": {
              "type": "string"
            },
            "timeoutSeconds": {
              "type": "integer",
              "minimum": 1
            }
          }
        }
      },
      "required": [
        "body",
        "hookId",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/projects/{projectId}/hooks/{hookId}",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "hookId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Resource deleted."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Delete Project Hook Config",
    "operationId": "deleteProjectHookConfig",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "hookId": {
          "type": "string"
        }
      },
      "required": [
        "hookId",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/topology",
    "tags": [
      "Topology"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "stage",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "applicationId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "origins",
        "in": "query",
        "required": false,
        "schema": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Get Project Topology",
    "operationId": "getProjectTopology",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "stage": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        },
        "origins": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "required": [
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/service-bindings",
    "tags": [
      "Topology"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObjectList"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Service Bindings",
    "operationId": "listServiceBindings",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        }
      },
      "required": [
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/service-bindings",
    "tags": [
      "Topology"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Create Service Binding",
    "operationId": "createServiceBinding",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/ServiceBindingInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/ServiceBindingInput",
          "type": "object",
          "required": [
            "sourceApplicationId",
            "targetApplicationId"
          ],
          "properties": {
            "enabled": {
              "type": "boolean"
            },
            "hostEnvVar": {
              "type": "string"
            },
            "injectionMode": {
              "type": "string"
            },
            "path": {
              "type": "string"
            },
            "portEnvVar": {
              "type": "string"
            },
            "protocol": {
              "type": "string"
            },
            "sourceApplicationId": {
              "type": "string"
            },
            "sourceDeploymentTargetId": {
              "type": "string"
            },
            "targetApplicationId": {
              "type": "string"
            },
            "targetDeploymentTargetId": {
              "type": "string"
            },
            "targetPort": {
              "type": "integer",
              "minimum": 1,
              "maximum": 65535
            },
            "targetPortName": {
              "type": "string"
            },
            "urlEnvVar": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/projects/{projectId}/service-bindings/{bindingId}",
    "tags": [
      "Topology"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "bindingId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Update Service Binding",
    "operationId": "updateServiceBinding",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/ServiceBindingInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "bindingId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/ServiceBindingInput",
          "type": "object",
          "required": [
            "sourceApplicationId",
            "targetApplicationId"
          ],
          "properties": {
            "enabled": {
              "type": "boolean"
            },
            "hostEnvVar": {
              "type": "string"
            },
            "injectionMode": {
              "type": "string"
            },
            "path": {
              "type": "string"
            },
            "portEnvVar": {
              "type": "string"
            },
            "protocol": {
              "type": "string"
            },
            "sourceApplicationId": {
              "type": "string"
            },
            "sourceDeploymentTargetId": {
              "type": "string"
            },
            "targetApplicationId": {
              "type": "string"
            },
            "targetDeploymentTargetId": {
              "type": "string"
            },
            "targetPort": {
              "type": "integer",
              "minimum": 1,
              "maximum": 65535
            },
            "targetPortName": {
              "type": "string"
            },
            "urlEnvVar": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "bindingId",
        "body",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/projects/{projectId}/service-bindings/{bindingId}",
    "tags": [
      "Topology"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "bindingId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Resource deleted."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Delete Service Binding",
    "operationId": "deleteServiceBinding",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "bindingId": {
          "type": "string"
        }
      },
      "required": [
        "bindingId",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/service-bindings/{bindingId}/check",
    "tags": [
      "Topology"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "bindingId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Check Service Binding",
    "operationId": "checkServiceBinding",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "bindingId": {
          "type": "string"
        }
      },
      "required": [
        "bindingId",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/topology-edges",
    "tags": [
      "Topology"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObjectList"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Project Topology Edges",
    "operationId": "listProjectTopologyEdges",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        }
      },
      "required": [
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/topology-edges",
    "tags": [
      "Topology"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Create Project Topology Edge",
    "operationId": "createProjectTopologyEdge",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/TopologyEdgeInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/TopologyEdgeInput",
          "allOf": [
            {
              "ref": "#/components/schemas/ServiceBindingInput",
              "type": "object",
              "required": [
                "sourceApplicationId",
                "targetApplicationId"
              ],
              "properties": {
                "enabled": {
                  "type": "boolean"
                },
                "hostEnvVar": {
                  "type": "string"
                },
                "injectionMode": {
                  "type": "string"
                },
                "path": {
                  "type": "string"
                },
                "portEnvVar": {
                  "type": "string"
                },
                "protocol": {
                  "type": "string"
                },
                "sourceApplicationId": {
                  "type": "string"
                },
                "sourceDeploymentTargetId": {
                  "type": "string"
                },
                "targetApplicationId": {
                  "type": "string"
                },
                "targetDeploymentTargetId": {
                  "type": "string"
                },
                "targetPort": {
                  "type": "integer",
                  "minimum": 1,
                  "maximum": 65535
                },
                "targetPortName": {
                  "type": "string"
                },
                "urlEnvVar": {
                  "type": "string"
                }
              }
            },
            {
              "type": "object",
              "properties": {
                "relationType": {
                  "type": "string"
                }
              }
            }
          ]
        }
      },
      "required": [
        "body",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/projects/{projectId}/topology-edges/{edgeId}",
    "tags": [
      "Topology"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "edgeId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Update Project Topology Edge",
    "operationId": "updateProjectTopologyEdge",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/TopologyEdgeInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "edgeId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/TopologyEdgeInput",
          "allOf": [
            {
              "ref": "#/components/schemas/ServiceBindingInput",
              "type": "object",
              "required": [
                "sourceApplicationId",
                "targetApplicationId"
              ],
              "properties": {
                "enabled": {
                  "type": "boolean"
                },
                "hostEnvVar": {
                  "type": "string"
                },
                "injectionMode": {
                  "type": "string"
                },
                "path": {
                  "type": "string"
                },
                "portEnvVar": {
                  "type": "string"
                },
                "protocol": {
                  "type": "string"
                },
                "sourceApplicationId": {
                  "type": "string"
                },
                "sourceDeploymentTargetId": {
                  "type": "string"
                },
                "targetApplicationId": {
                  "type": "string"
                },
                "targetDeploymentTargetId": {
                  "type": "string"
                },
                "targetPort": {
                  "type": "integer",
                  "minimum": 1,
                  "maximum": 65535
                },
                "targetPortName": {
                  "type": "string"
                },
                "urlEnvVar": {
                  "type": "string"
                }
              }
            },
            {
              "type": "object",
              "properties": {
                "relationType": {
                  "type": "string"
                }
              }
            }
          ]
        }
      },
      "required": [
        "body",
        "edgeId",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/projects/{projectId}/topology-edges/{edgeId}",
    "tags": [
      "Topology"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "edgeId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Resource deleted."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Delete Project Topology Edge",
    "operationId": "deleteProjectTopologyEdge",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "edgeId": {
          "type": "string"
        }
      },
      "required": [
        "edgeId",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/hook-runs",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "phase",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "buildRunId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "releaseId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObjectList"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Project Hook Runs",
    "operationId": "listProjectHookRuns",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "phase": {
          "type": "string"
        },
        "buildRunId": {
          "type": "string"
        },
        "releaseId": {
          "type": "string"
        }
      },
      "required": [
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/hook-runs/{runId}/logs",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "runId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Get Project Hook Run Log",
    "operationId": "getProjectHookRunLog",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "runId": {
          "type": "string"
        }
      },
      "required": [
        "projectId",
        "runId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/app-templates/{templateId}/install",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "templateId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Install App Template",
    "operationId": "installAppTemplate",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/AppTemplateInstallInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "templateId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/AppTemplateInstallInput",
          "type": "object",
          "required": [
            "applicationIdentifier",
            "applicationName",
            "clusterId",
            "deploymentName",
            "stage"
          ],
          "properties": {
            "applicationIdentifier": {
              "type": "string"
            },
            "applicationName": {
              "type": "string"
            },
            "clusterId": {
              "type": "string"
            },
            "cpuRequest": {
              "type": "string"
            },
            "dataCapacity": {
              "type": "string"
            },
            "deploymentName": {
              "type": "string"
            },
            "imageRef": {
              "type": "string"
            },
            "installNow": {
              "type": "boolean"
            },
            "memoryRequest": {
              "type": "string"
            },
            "namespace": {
              "type": "string"
            },
            "replicas": {
              "type": "integer",
              "minimum": 0
            },
            "stage": {
              "type": "string"
            },
            "values": {
              "type": "object",
              "additionalProperties": true
            }
          }
        }
      },
      "required": [
        "body",
        "projectId",
        "templateId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/member-candidates",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "search",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObjectList"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Search Project Member Candidates",
    "operationId": "searchProjectMemberCandidates",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "search": {
          "type": "string"
        },
        "limit": {
          "type": "integer",
          "format": "int32"
        }
      },
      "required": [
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/applications/{applicationId}/deployment-targets/{targetId}/restart",
    "tags": [
      "Deployments"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "applicationId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "targetId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Restart Deployment Target",
    "operationId": "restartDeploymentTarget",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        },
        "targetId": {
          "type": "string"
        }
      },
      "required": [
        "applicationId",
        "projectId",
        "targetId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/applications/{applicationId}/deployment-targets/{targetId}/metrics/stream",
    "tags": [
      "Deployments"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "applicationId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "targetId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "tail",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "text/plain"
        ],
        "schemaRefs": [],
        "description": "Protocol stream established."
      }
    ],
    "summary": "Stream Deployment Target Metrics",
    "operationId": "streamDeploymentTargetMetrics",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        },
        "targetId": {
          "type": "string"
        },
        "tail": {
          "type": "integer",
          "format": "int32"
        }
      },
      "required": [
        "applicationId",
        "projectId",
        "targetId"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "classification": "protocol-adapter",
      "hidden": true,
      "exclusionReason": "Streaming metrics transport consumed by the explicit CLI deployment-metrics protocol adapter."
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/build-runs",
    "tags": [
      "Builds"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "applicationId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "deploymentTargetId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "status",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "triggerType",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "sourceBranch",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "createdBy",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/PaginatedBusinessObjects"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Build Runs",
    "operationId": "listBuildRuns",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        },
        "deploymentTargetId": {
          "type": "string"
        },
        "status": {
          "type": "string"
        },
        "triggerType": {
          "type": "string"
        },
        "sourceBranch": {
          "type": "string"
        },
        "createdBy": {
          "type": "string"
        },
        "page": {
          "type": "integer",
          "format": "int32"
        },
        "pageSize": {
          "type": "integer",
          "format": "int32"
        }
      },
      "required": [
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/build-runs/trigger",
    "tags": [
      "Builds"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Trigger Build Run",
    "operationId": "triggerBuildRun",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/BuildRunInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/BuildRunInput",
          "type": "object",
          "required": [
            "applicationId",
            "deploymentTargetId"
          ],
          "properties": {
            "applicationId": {
              "type": "string"
            },
            "buildArgs": {
              "type": "object",
              "additionalProperties": {
                "type": "string"
              }
            },
            "buildContext": {
              "type": "string"
            },
            "buildCpuRequest": {
              "type": "string"
            },
            "buildDirectory": {
              "type": "string"
            },
            "buildEnvironmentId": {
              "type": "string"
            },
            "buildMemoryRequest": {
              "type": "string"
            },
            "buildTimeoutSeconds": {
              "type": "integer",
              "minimum": 1
            },
            "buildVariableSetIds": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "cacheConfig": {
              "type": "object",
              "additionalProperties": true
            },
            "deploymentTargetId": {
              "type": "string"
            },
            "dockerfilePath": {
              "type": "string"
            },
            "imageRef": {
              "type": "string"
            },
            "sourceBranch": {
              "type": "string"
            },
            "sourceCommit": {
              "type": "string"
            },
            "sourceTag": {
              "type": "string"
            },
            "targetImageRef": {
              "type": "string"
            },
            "targetRegistryId": {
              "type": "string"
            },
            "targetRepository": {
              "type": "string"
            },
            "targetTag": {
              "type": "string"
            },
            "triggerType": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/build-runs/{runId}",
    "tags": [
      "Builds"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "runId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Get Build Run",
    "operationId": "getBuildRun",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "runId": {
          "type": "string"
        }
      },
      "required": [
        "projectId",
        "runId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/projects/{projectId}/build-runs/{runId}",
    "tags": [
      "Builds"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "runId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Resource deleted."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Delete Build Run",
    "operationId": "deleteBuildRun",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "runId": {
          "type": "string"
        }
      },
      "required": [
        "projectId",
        "runId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/build-runs/{runId}/retry",
    "tags": [
      "Builds"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "runId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Retry Build Run",
    "operationId": "retryBuildRun",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "runId": {
          "type": "string"
        }
      },
      "required": [
        "projectId",
        "runId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/build-runs/{runId}/cancel",
    "tags": [
      "Builds"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "runId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Cancel Build Run",
    "operationId": "cancelBuildRun",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "runId": {
          "type": "string"
        }
      },
      "required": [
        "projectId",
        "runId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/build-jobs",
    "tags": [
      "Builds"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "buildRunId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/PaginatedBusinessObjects"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Build Jobs",
    "operationId": "listBuildJobs",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "buildRunId": {
          "type": "string"
        },
        "page": {
          "type": "integer",
          "format": "int32"
        },
        "pageSize": {
          "type": "integer",
          "format": "int32"
        }
      },
      "required": [
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/build-jobs/{jobId}",
    "tags": [
      "Builds"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "jobId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Get Build Job",
    "operationId": "getBuildJob",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "jobId": {
          "type": "string"
        }
      },
      "required": [
        "jobId",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/build-jobs/{jobId}/logs",
    "tags": [
      "Builds"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "jobId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Get Build Job Logs",
    "operationId": "getBuildJobLogs",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "jobId": {
          "type": "string"
        }
      },
      "required": [
        "jobId",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/build-jobs/{jobId}/logs/stream",
    "tags": [
      "Builds"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "jobId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "text/plain"
        ],
        "schemaRefs": [],
        "description": "Protocol stream established."
      }
    ],
    "summary": "Stream Build Job Logs",
    "operationId": "streamBuildJobLogs",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "jobId": {
          "type": "string"
        }
      },
      "required": [
        "jobId",
        "projectId"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "classification": "protocol-adapter",
      "hidden": true,
      "exclusionReason": "Streaming log transport consumed by the explicit CLI build-log protocol adapter."
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/releases",
    "tags": [
      "Releases"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "environmentId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "deploymentTargetId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/PaginatedBusinessObjects"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Releases",
    "operationId": "listReleases",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "environmentId": {
          "type": "string"
        },
        "deploymentTargetId": {
          "type": "string"
        },
        "page": {
          "type": "integer",
          "format": "int32"
        },
        "pageSize": {
          "type": "integer",
          "format": "int32"
        }
      },
      "required": [
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/releases",
    "tags": [
      "Releases"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Create Release",
    "operationId": "createRelease",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/ReleaseInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/ReleaseInput",
          "type": "object",
          "required": [
            "applicationId",
            "deploymentTargetId"
          ],
          "properties": {
            "applicationId": {
              "type": "string"
            },
            "buildRunId": {
              "type": "string"
            },
            "deploymentTargetId": {
              "type": "string"
            },
            "environmentId": {
              "type": "string"
            },
            "forceImagePull": {
              "type": "boolean"
            },
            "imageRef": {
              "type": "string"
            },
            "message": {
              "type": "string"
            },
            "revision": {
              "type": "string"
            },
            "status": {
              "type": "string"
            },
            "type": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/releases/{releaseId}/logs",
    "tags": [
      "Releases"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "releaseId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Get Release Logs",
    "operationId": "getReleaseLogs",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "releaseId": {
          "type": "string"
        }
      },
      "required": [
        "projectId",
        "releaseId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/releases/{releaseId}/runtime-logs",
    "tags": [
      "Releases"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "releaseId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "tailLines",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      },
      {
        "name": "container",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Get Release Runtime Logs",
    "operationId": "getReleaseRuntimeLogs",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "releaseId": {
          "type": "string"
        },
        "tailLines": {
          "type": "integer",
          "format": "int32"
        },
        "container": {
          "type": "string"
        }
      },
      "required": [
        "projectId",
        "releaseId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/releases/{releaseId}/exec",
    "tags": [
      "Releases"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "releaseId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Exec Release Runtime Command",
    "operationId": "execReleaseRuntimeCommand",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/ReleaseRuntimeExecInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "releaseId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/ReleaseRuntimeExecInput",
          "type": "object",
          "required": [
            "command"
          ],
          "properties": {
            "command": {
              "oneOf": [
                {
                  "type": "string"
                },
                {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              ]
            },
            "container": {
              "type": "string"
            },
            "stdin": {
              "type": "string"
            },
            "tty": {
              "type": "boolean"
            }
          }
        }
      },
      "required": [
        "body",
        "projectId",
        "releaseId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/releases/{releaseId}/terminal",
    "tags": [
      "Releases"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "releaseId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "container",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "ticket",
        "in": "query",
        "required": false,
        "description": "Short-lived one-time ticket returned by `authorizeReleaseRuntimeTerminal`. Required for Luna CLI; omitted by the existing browser cookie flow.",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "101",
        "contentTypes": [
          "text/plain"
        ],
        "schemaRefs": [],
        "description": "WebSocket protocol switch accepted after the ticket or browser session is authorized."
      }
    ],
    "summary": "Stream Release Runtime Terminal",
    "description": "Opens the release terminal WebSocket. Luna CLI passes the short-lived one-time ticket returned by the authorize endpoint in the `ticket` query parameter; browser callers may omit it and continue using the existing session-cookie flow.",
    "operationId": "streamReleaseRuntimeTerminal",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "releaseId": {
          "type": "string"
        },
        "container": {
          "type": "string"
        },
        "ticket": {
          "type": "string"
        }
      },
      "required": [
        "projectId",
        "releaseId"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "classification": "protocol-adapter",
      "hidden": true,
      "exclusionReason": "WebSocket terminal transport consumed by the explicit CLI release-terminal protocol adapter."
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/releases/{releaseId}/rollback",
    "tags": [
      "Releases"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "releaseId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Rollback Release",
    "operationId": "rollbackRelease",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "releaseId": {
          "type": "string"
        }
      },
      "required": [
        "projectId",
        "releaseId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/gateway-routes",
    "tags": [
      "Gateway"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObjectList"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Gateway Routes",
    "operationId": "listGatewayRoutes",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        }
      },
      "required": [
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/gateway-routes",
    "tags": [
      "Gateway"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Create Gateway Route",
    "operationId": "createGatewayRoute",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/GatewayRouteInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/GatewayRouteInput",
          "type": "object",
          "required": [
            "applicationId",
            "deploymentTargetId"
          ],
          "properties": {
            "applicationId": {
              "type": "string"
            },
            "backendWeight": {
              "type": "integer",
              "minimum": 1
            },
            "deploymentTargetId": {
              "type": "string"
            },
            "dnsStatus": {
              "type": "string"
            },
            "domainSuffix": {
              "type": "string"
            },
            "enabled": {
              "type": "boolean"
            },
            "environmentId": {
              "type": "string"
            },
            "host": {
              "type": "string"
            },
            "hostnameAliases": {
              "type": "string"
            },
            "isDefault": {
              "type": "boolean"
            },
            "parentGatewayName": {
              "type": "string"
            },
            "parentGatewayNamespace": {
              "type": "string"
            },
            "path": {
              "type": "string"
            },
            "pathMatchType": {
              "type": "string",
              "enum": [
                "PathPrefix",
                "Exact"
              ]
            },
            "requestHeaders": {
              "type": "string"
            },
            "requestRedirect": {
              "type": "string"
            },
            "responseHeaders": {
              "type": "string"
            },
            "sectionName": {
              "type": "string"
            },
            "servicePort": {
              "type": "integer",
              "minimum": 1,
              "maximum": 65535
            },
            "status": {
              "type": "string"
            },
            "tlsMode": {
              "type": "string"
            },
            "urlRewrite": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "put",
    "path": "/api/v1/projects/{projectId}/gateway-routes/{routeId}",
    "tags": [
      "Gateway"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "routeId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Update Gateway Route",
    "operationId": "updateGatewayRoute",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/GatewayRouteInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "routeId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/GatewayRouteInput",
          "type": "object",
          "required": [
            "applicationId",
            "deploymentTargetId"
          ],
          "properties": {
            "applicationId": {
              "type": "string"
            },
            "backendWeight": {
              "type": "integer",
              "minimum": 1
            },
            "deploymentTargetId": {
              "type": "string"
            },
            "dnsStatus": {
              "type": "string"
            },
            "domainSuffix": {
              "type": "string"
            },
            "enabled": {
              "type": "boolean"
            },
            "environmentId": {
              "type": "string"
            },
            "host": {
              "type": "string"
            },
            "hostnameAliases": {
              "type": "string"
            },
            "isDefault": {
              "type": "boolean"
            },
            "parentGatewayName": {
              "type": "string"
            },
            "parentGatewayNamespace": {
              "type": "string"
            },
            "path": {
              "type": "string"
            },
            "pathMatchType": {
              "type": "string",
              "enum": [
                "PathPrefix",
                "Exact"
              ]
            },
            "requestHeaders": {
              "type": "string"
            },
            "requestRedirect": {
              "type": "string"
            },
            "responseHeaders": {
              "type": "string"
            },
            "sectionName": {
              "type": "string"
            },
            "servicePort": {
              "type": "integer",
              "minimum": 1,
              "maximum": 65535
            },
            "status": {
              "type": "string"
            },
            "tlsMode": {
              "type": "string"
            },
            "urlRewrite": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body",
        "projectId",
        "routeId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/projects/{projectId}/gateway-routes/{routeId}",
    "tags": [
      "Gateway"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "routeId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Resource deleted."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Delete Gateway Route",
    "operationId": "deleteGatewayRoute",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "routeId": {
          "type": "string"
        }
      },
      "required": [
        "projectId",
        "routeId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/projects/{projectId}/gateway-routes/check-domain",
    "tags": [
      "Gateway"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "domainSuffix",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "host",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "routeId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Check Gateway Domain",
    "operationId": "checkGatewayDomain",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "domainSuffix": {
          "type": "string"
        },
        "host": {
          "type": "string"
        },
        "routeId": {
          "type": "string"
        }
      },
      "required": [
        "host",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/projects/{projectId}/repository-bindings/{bindingId}/webhook/reconfigure",
    "tags": [
      "Projects"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "projectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "bindingId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Reconfigure Repository Webhook",
    "operationId": "reconfigureRepositoryWebhook",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "bindingId": {
          "type": "string"
        }
      },
      "required": [
        "bindingId",
        "projectId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/billing/summary",
    "tags": [
      "Billing"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "accountScope",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "userId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "projectId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      {
        "name": "periodStart",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "periodEnd",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BillingSummary"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Get Billing Summary",
    "operationId": "getBillingSummary",
    "inputSchema": {
      "type": "object",
      "properties": {
        "accountScope": {
          "type": "string"
        },
        "userId": {
          "type": "string"
        },
        "projectId": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "periodStart": {
          "type": "string"
        },
        "periodEnd": {
          "type": "string"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/billing/deployment-spend",
    "tags": [
      "Billing"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "userId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "projectId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      {
        "name": "periodStart",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "periodEnd",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/PaginatedBusinessObjects"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Billing Deployment Spend",
    "operationId": "listBillingDeploymentSpend",
    "inputSchema": {
      "type": "object",
      "properties": {
        "userId": {
          "type": "string"
        },
        "projectId": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "periodStart": {
          "type": "string"
        },
        "periodEnd": {
          "type": "string"
        },
        "page": {
          "type": "integer",
          "format": "int32"
        },
        "pageSize": {
          "type": "integer",
          "format": "int32"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/billing/ledger",
    "tags": [
      "Billing"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "userId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "projectId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      {
        "name": "type",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "periodStart",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "periodEnd",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/PaginatedBusinessObjects"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Billing Ledger Entries",
    "operationId": "listBillingLedgerEntries",
    "inputSchema": {
      "type": "object",
      "properties": {
        "userId": {
          "type": "string"
        },
        "projectId": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "type": {
          "type": "string"
        },
        "periodStart": {
          "type": "string"
        },
        "periodEnd": {
          "type": "string"
        },
        "page": {
          "type": "integer",
          "format": "int32"
        },
        "pageSize": {
          "type": "integer",
          "format": "int32"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/billing/usage-records",
    "tags": [
      "Billing"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [
      {
        "name": "userId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "projectId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      {
        "name": "meter",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "periodStart",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "periodEnd",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      },
      {
        "name": "pageSize",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/PaginatedBusinessObjects"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Billing Usage Records",
    "operationId": "listBillingUsageRecords",
    "inputSchema": {
      "type": "object",
      "properties": {
        "userId": {
          "type": "string"
        },
        "projectId": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "meter": {
          "type": "string"
        },
        "periodStart": {
          "type": "string"
        },
        "periodEnd": {
          "type": "string"
        },
        "page": {
          "type": "integer",
          "format": "int32"
        },
        "pageSize": {
          "type": "integer",
          "format": "int32"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/billing/rate-rules",
    "tags": [
      "Billing"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObjectList"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "List Billing Rate Rules",
    "operationId": "listBillingRateRules"
  },
  {
    "method": "put",
    "path": "/api/v1/billing/rate-rules",
    "tags": [
      "Billing"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Update Billing Rate Rules",
    "operationId": "updateBillingRateRules",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/BillingRateRulesInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/BillingRateRulesInput",
          "type": "object",
          "required": [
            "rules"
          ],
          "properties": {
            "rules": {
              "type": "array",
              "items": {
                "type": "object",
                "required": [
                  "creditsPerUnit",
                  "enabled",
                  "meter"
                ],
                "properties": {
                  "creditsPerUnit": {
                    "type": "number",
                    "minimum": 0
                  },
                  "enabled": {
                    "type": "boolean"
                  },
                  "meter": {
                    "type": "string"
                  }
                }
              }
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/billing/wallet-transactions",
    "tags": [
      "Billing"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Create Billing Wallet Transaction",
    "operationId": "createBillingWalletTransaction",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/BillingWalletTransactionInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/BillingWalletTransactionInput",
          "type": "object",
          "required": [
            "amountCredits",
            "type"
          ],
          "properties": {
            "amountCredits": {
              "type": "number"
            },
            "description": {
              "type": "string"
            },
            "type": {
              "type": "string"
            },
            "userId": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/billing/external-transactions",
    "tags": [
      "Billing"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Create External Billing Transaction",
    "operationId": "createExternalBillingTransaction",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/ExternalBillingTransactionInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/ExternalBillingTransactionInput",
          "allOf": [
            {
              "ref": "#/components/schemas/BillingWalletTransactionInput",
              "type": "object",
              "required": [
                "amountCredits",
                "type"
              ],
              "properties": {
                "amountCredits": {
                  "type": "number"
                },
                "description": {
                  "type": "string"
                },
                "type": {
                  "type": "string"
                },
                "userId": {
                  "type": "string"
                }
              }
            },
            {
              "type": "object",
              "required": [
                "idempotencyKey"
              ],
              "properties": {
                "idempotencyKey": {
                  "type": "string",
                  "minLength": 1
                }
              }
            }
          ]
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/billing/gateway-traffic/hello",
    "tags": [
      "Billing"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Create Gateway Traffic Probe Hello",
    "operationId": "createGatewayTrafficProbeHello",
    "requestBody": {
      "required": false,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": []
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "type": "object",
          "additionalProperties": true
        }
      },
      "additionalProperties": false
    },
    "xLunaCli": {
      "hidden": true,
      "exclusionReason": "Protocol endpoint consumed by a browser, webhook, probe, stream, or terminal adapter instead of a regular CLI command."
    }
  },
  {
    "method": "post",
    "path": "/api/v1/billing/gateway-traffic",
    "tags": [
      "Billing"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Create Gateway Traffic Usage",
    "operationId": "createGatewayTrafficUsage",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/GatewayTrafficUsageInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/GatewayTrafficUsageInput",
          "type": "object",
          "required": [
            "periodEnd",
            "periodStart",
            "requestCount",
            "responseBytes",
            "routeId"
          ],
          "properties": {
            "periodEnd": {
              "type": "string",
              "format": "date-time"
            },
            "periodStart": {
              "type": "string",
              "format": "date-time"
            },
            "requestCount": {
              "type": "integer",
              "format": "int64",
              "minimum": 0
            },
            "responseBytes": {
              "type": "integer",
              "format": "int64",
              "minimum": 0
            },
            "routeId": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    },
    "xLunaCli": {
      "hidden": true,
      "exclusionReason": "Protocol endpoint consumed by a browser, webhook, probe, stream, or terminal adapter instead of a regular CLI command."
    }
  },
  {
    "method": "get",
    "path": "/api/v1/billing/gateway-traffic-status",
    "tags": [
      "Billing"
    ],
    "deprecated": false,
    "security": [],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/BusinessObject"
        ],
        "description": "Successful business response."
      },
      {
        "status": "400",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The request is invalid or cannot be processed."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Get Gateway Traffic Status",
    "operationId": "getGatewayTrafficStatus"
  },
  {
    "method": "get",
    "path": "/api/v1/ai/capabilities",
    "tags": [
      "AI Assistant"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AIObject"
        ],
        "description": "Capability result"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      }
    ],
    "summary": "Resolve AI assistant availability for the current browser session",
    "operationId": "getAICapabilities"
  },
  {
    "method": "get",
    "path": "/api/v1/ai/conversations",
    "tags": [
      "AI Assistant"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AIObject"
        ],
        "description": "Paginated conversation list"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      }
    ],
    "summary": "List conversations owned by the current session user",
    "operationId": "listAIConversations"
  },
  {
    "method": "post",
    "path": "/api/v1/ai/conversations",
    "tags": [
      "AI Assistant"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [],
    "responses": [
      {
        "status": "201",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AIObject"
        ],
        "description": "Conversation created"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      }
    ],
    "summary": "Create a private AI conversation",
    "operationId": "createAIConversation",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/AIObject"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/AIObject",
          "type": "object",
          "description": "Versioned AI Agent response projected through the Luna API BFF.",
          "additionalProperties": true
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/ai/conversations/{conversationId}",
    "tags": [
      "AI Assistant"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [
      {
        "name": "conversationId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AIObject"
        ],
        "description": "Conversation"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "operationId": "getAIConversation",
    "inputSchema": {
      "type": "object",
      "properties": {
        "conversationId": {
          "type": "string"
        }
      },
      "required": [
        "conversationId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "delete",
    "path": "/api/v1/ai/conversations/{conversationId}",
    "tags": [
      "AI Assistant"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [
      {
        "name": "conversationId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "204",
        "contentTypes": [],
        "schemaRefs": [],
        "description": "Conversation physically deleted"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested state transition conflicts with the current durable state."
      }
    ],
    "operationId": "deleteAIConversation",
    "inputSchema": {
      "type": "object",
      "properties": {
        "conversationId": {
          "type": "string"
        }
      },
      "required": [
        "conversationId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "patch",
    "path": "/api/v1/ai/conversations/{conversationId}",
    "tags": [
      "AI Assistant"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [
      {
        "name": "conversationId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AIObject"
        ],
        "description": "Updated conversation"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "operationId": "updateAIConversation",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/AIObject"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "conversationId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/AIObject",
          "type": "object",
          "description": "Versioned AI Agent response projected through the Luna API BFF.",
          "additionalProperties": true
        }
      },
      "required": [
        "body",
        "conversationId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/ai/conversations/{conversationId}/timeline",
    "tags": [
      "AI Assistant"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [
      {
        "name": "conversationId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AIObject"
        ],
        "description": "Durable conversation timeline snapshot"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "operationId": "getAIConversationTimeline",
    "inputSchema": {
      "type": "object",
      "properties": {
        "conversationId": {
          "type": "string"
        }
      },
      "required": [
        "conversationId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/ai/conversations/{conversationId}/turns",
    "tags": [
      "AI Assistant"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [
      {
        "name": "conversationId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "Idempotency-Key",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "202",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AIObject"
        ],
        "description": "Turn and initial run accepted"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested state transition conflicts with the current durable state."
      }
    ],
    "operationId": "createAITurn",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/AIObject"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "conversationId": {
          "type": "string"
        },
        "Idempotency-Key": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/AIObject",
          "type": "object",
          "description": "Versioned AI Agent response projected through the Luna API BFF.",
          "additionalProperties": true
        }
      },
      "required": [
        "Idempotency-Key",
        "body",
        "conversationId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/ai/ui-actions/pending",
    "tags": [
      "AI Assistant"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [
      {
        "name": "clientInstanceId",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 80,
          "pattern": "^[A-Za-z0-9_-]+$"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AIObject"
        ],
        "description": "Pending UI actions bound to the current user and browser client"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      }
    ],
    "summary": "List unacknowledged UI actions for the initiating browser client",
    "operationId": "listPendingAIUIActions",
    "inputSchema": {
      "type": "object",
      "properties": {
        "clientInstanceId": {
          "type": "string",
          "minLength": 16,
          "maxLength": 80,
          "pattern": "^[A-Za-z0-9_-]+$"
        }
      },
      "required": [
        "clientInstanceId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/ai/ui-actions/{actionId}/ack",
    "tags": [
      "AI Assistant"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [
      {
        "name": "actionId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "202",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AIObject"
        ],
        "description": "UI action acknowledgement accepted"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested state transition conflicts with the current durable state."
      }
    ],
    "summary": "Acknowledge a browser UI action after route execution succeeds or fails",
    "operationId": "acknowledgeAIUIAction",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/AIObject"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "actionId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/AIObject",
          "type": "object",
          "description": "Versioned AI Agent response projected through the Luna API BFF.",
          "additionalProperties": true
        }
      },
      "required": [
        "actionId",
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/ai/turns/{turnId}/runs",
    "tags": [
      "AI Assistant"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [
      {
        "name": "turnId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AIObject"
        ],
        "description": "Paginated run list"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "operationId": "listAIRuns",
    "inputSchema": {
      "type": "object",
      "properties": {
        "turnId": {
          "type": "string"
        }
      },
      "required": [
        "turnId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/ai/turns/{turnId}/runs",
    "tags": [
      "AI Assistant"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [
      {
        "name": "turnId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "Idempotency-Key",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "202",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AIObject"
        ],
        "description": "Regenerated run accepted"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested state transition conflicts with the current durable state."
      }
    ],
    "operationId": "createAIRun",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/AIObject"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "turnId": {
          "type": "string"
        },
        "Idempotency-Key": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/AIObject",
          "type": "object",
          "description": "Versioned AI Agent response projected through the Luna API BFF.",
          "additionalProperties": true
        }
      },
      "required": [
        "Idempotency-Key",
        "body",
        "turnId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/ai/runs/{runId}",
    "tags": [
      "AI Assistant"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [
      {
        "name": "runId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AIObject"
        ],
        "description": "Run state"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "operationId": "getAIRun",
    "inputSchema": {
      "type": "object",
      "properties": {
        "runId": {
          "type": "string"
        }
      },
      "required": [
        "runId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/api/v1/ai/runs/{runId}/events",
    "tags": [
      "AI Assistant"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [
      {
        "name": "runId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "after",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "format": "int64",
          "minimum": 0
        }
      },
      {
        "name": "Last-Event-ID",
        "in": "header",
        "required": false,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "text/event-stream"
        ],
        "schemaRefs": [],
        "description": "Unbuffered recoverable SSE stream of persisted content"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "summary": "Replay and stream durable run events",
    "operationId": "streamAIRunEvents",
    "inputSchema": {
      "type": "object",
      "properties": {
        "runId": {
          "type": "string"
        },
        "after": {
          "type": "integer",
          "format": "int64",
          "minimum": 0
        },
        "Last-Event-ID": {
          "type": "string"
        }
      },
      "required": [
        "runId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/ai/runs/{runId}/cancel",
    "tags": [
      "AI Assistant"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [
      {
        "name": "runId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "202",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AIObject"
        ],
        "description": "Cancellation accepted"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      }
    ],
    "operationId": "cancelAIRun",
    "inputSchema": {
      "type": "object",
      "properties": {
        "runId": {
          "type": "string"
        }
      },
      "required": [
        "runId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/ai/runs/{runId}/input",
    "tags": [
      "AI Assistant"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [
      {
        "name": "runId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "202",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AIObject"
        ],
        "description": "Supplemental input accepted"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested state transition conflicts with the current durable state."
      }
    ],
    "operationId": "submitAIRunInput",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/AIObject"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "runId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/AIObject",
          "type": "object",
          "description": "Versioned AI Agent response projected through the Luna API BFF.",
          "additionalProperties": true
        }
      },
      "required": [
        "body",
        "runId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/ai/runs/{runId}/approvals/{toolCallId}/decision",
    "tags": [
      "AI Assistant"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [
      {
        "name": "runId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "toolCallId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "202",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AIObject"
        ],
        "description": "Approval decision accepted"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested state transition conflicts with the current durable state."
      }
    ],
    "operationId": "decideAIToolApproval",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/AIObject"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "runId": {
          "type": "string"
        },
        "toolCallId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/AIObject",
          "type": "object",
          "description": "Versioned AI Agent response projected through the Luna API BFF.",
          "additionalProperties": true
        }
      },
      "required": [
        "body",
        "runId",
        "toolCallId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/api/v1/ai/runs/{runId}/mfa/{toolCallId}/resume",
    "tags": [
      "AI Assistant"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [
      {
        "name": "runId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "toolCallId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": [
      {
        "status": "202",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AIObject"
        ],
        "description": "MFA resume accepted"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "404",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested resource was not found."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested state transition conflicts with the current durable state."
      }
    ],
    "operationId": "resumeAIRunAfterMFA",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/AIObject"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "runId": {
          "type": "string"
        },
        "toolCallId": {
          "type": "string"
        },
        "body": {
          "ref": "#/components/schemas/AIObject",
          "type": "object",
          "description": "Versioned AI Agent response projected through the Luna API BFF.",
          "additionalProperties": true
        }
      },
      "required": [
        "body",
        "runId",
        "toolCallId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/internal/v1/ai/delegations/exchange",
    "tags": [
      "AI Assistant Internal"
    ],
    "deprecated": false,
    "security": [
      {
        "AIAgentServiceToken": []
      }
    ],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AIDelegationResponse"
        ],
        "description": "Short-lived operation-bound delegation"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      }
    ],
    "summary": "Exchange a bound Run Actor Grant for a 60-second tool delegation",
    "operationId": "exchangeAIRunActorGrant",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": [
        "#/components/schemas/AIDelegationExchangeInput"
      ]
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "ref": "#/components/schemas/AIDelegationExchangeInput",
          "type": "object",
          "required": [
            "approvalGranted",
            "argumentsHash",
            "operationId",
            "requestedScopes",
            "runActorGrant",
            "runId",
            "toolCallId"
          ],
          "properties": {
            "approvalGranted": {
              "type": "boolean",
              "description": "True only after the Agent validated the current parameter-bound approval."
            },
            "argumentsHash": {
              "type": "string",
              "pattern": "^sha256:[0-9a-f]{64}$"
            },
            "mfaPurpose": {
              "type": "string",
              "description": "Present only after a matching Step-up resume."
            },
            "operationId": {
              "type": "string"
            },
            "requestedScopes": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "runActorGrant": {
              "type": "string"
            },
            "runId": {
              "type": "string"
            },
            "stepUpAssertionId": {
              "type": "string",
              "description": "API-issued assertion revalidated for the delegated user"
            },
            "toolCallId": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/internal/v1/ai/tools/{operationId}/execute",
    "tags": [
      "AI Assistant Internal"
    ],
    "deprecated": false,
    "security": [
      {
        "AIDelegationToken": []
      }
    ],
    "parameters": [
      {
        "name": "operationId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string",
          "enum": [
            "getDashboard",
            "listProjects",
            "listPlatformEvents",
            "getProject",
            "listApplications",
            "listBuildRuns",
            "listReleases",
            "listRuntimeClusters",
            "listGatewayRoutes",
            "listGatewayCertificates",
            "listProjectHookRuns",
            "listNotificationDeliveries",
            "listRuntimeEvents"
          ]
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AIObject"
        ],
        "description": "Redacted diagnostic result"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "409",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The requested state transition conflicts with the current durable state."
      }
    ],
    "summary": "Execute one registered diagnostic operation with a bound delegation",
    "operationId": "executeRegisteredAITool",
    "requestBody": {
      "required": true,
      "contentTypes": [
        "application/json"
      ],
      "schemaRefs": []
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "operationId": {
          "type": "string",
          "enum": [
            "getDashboard",
            "listProjects",
            "listPlatformEvents",
            "getProject",
            "listApplications",
            "listBuildRuns",
            "listReleases",
            "listRuntimeClusters",
            "listGatewayRoutes",
            "listGatewayCertificates",
            "listProjectHookRuns",
            "listNotificationDeliveries",
            "listRuntimeEvents"
          ]
        },
        "body": {
          "type": "object",
          "required": [
            "arguments"
          ],
          "properties": {
            "arguments": {
              "type": "object",
              "additionalProperties": true
            }
          }
        }
      },
      "required": [
        "body",
        "operationId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "post",
    "path": "/internal/v1/ai/tools/{operationId}/verify",
    "tags": [
      "AI Assistant Internal"
    ],
    "deprecated": false,
    "security": [
      {
        "AIDelegationToken": []
      }
    ],
    "parameters": [
      {
        "name": "operationId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string",
          "enum": [
            "getDashboard",
            "listPlatformEvents",
            "getProject",
            "listApplications",
            "listBuildRuns",
            "listReleases",
            "listRuntimeClusters",
            "listGatewayRoutes",
            "listGatewayCertificates",
            "listProjectHookRuns",
            "listNotificationDeliveries",
            "listRuntimeEvents"
          ]
        }
      }
    ],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AIObject"
        ],
        "description": "Current policy verification"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      }
    ],
    "summary": "Re-authorize a registered operation and inspect its bound policy",
    "operationId": "verifyRegisteredAITool",
    "inputSchema": {
      "type": "object",
      "properties": {
        "operationId": {
          "type": "string",
          "enum": [
            "getDashboard",
            "listPlatformEvents",
            "getProject",
            "listApplications",
            "listBuildRuns",
            "listReleases",
            "listRuntimeClusters",
            "listGatewayRoutes",
            "listGatewayCertificates",
            "listProjectHookRuns",
            "listNotificationDeliveries",
            "listRuntimeEvents"
          ]
        }
      },
      "required": [
        "operationId"
      ],
      "additionalProperties": false
    }
  },
  {
    "method": "get",
    "path": "/internal/v1/ai/provider-config",
    "tags": [
      "AI Assistant Internal"
    ],
    "deprecated": false,
    "security": [
      {
        "AIAgentServiceToken": []
      }
    ],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AIProviderInternalConfig"
        ],
        "description": "Non-cacheable Provider configuration, including the decrypted API key for in-memory Agent use."
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      }
    ],
    "summary": "Return the versioned Provider and runtime policy required by Agent",
    "operationId": "getInternalAIProviderConfig"
  },
  {
    "method": "post",
    "path": "/api/v1/configs/ai/provider/test",
    "tags": [
      "AI Assistant"
    ],
    "deprecated": false,
    "security": [
      {
        "SessionCookie": []
      }
    ],
    "parameters": [],
    "responses": [
      {
        "status": "200",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/AIObject"
        ],
        "description": "Stable Provider connection result"
      },
      {
        "status": "401",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "A valid interactive browser session is required."
      },
      {
        "status": "403",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "The authenticated principal is not allowed to perform this operation."
      },
      {
        "status": "503",
        "contentTypes": [
          "application/json"
        ],
        "schemaRefs": [
          "#/components/schemas/ErrorResponse"
        ],
        "description": "Agent or Provider is unavailable"
      }
    ],
    "summary": "Ask Agent to perform a minimal read-only Provider connection test",
    "operationId": "testAIProviderConnection"
  }
] as const satisfies readonly OpenApiOperationSnapshot[];
