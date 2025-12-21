# Set the registry and authentication for the private npm registry using credentials from Artifactory.

shamefully-hoist=true
strict-peer-dependencies=false
registry=https://${ARTIFACTORY_REGISTRY}/artifactory/api/npm/${ARTIFACTORY_VIRTUAL_REPO}/
//${ARTIFACTORY_REGISTRY}/artifactory/api/npm/${ARTIFACTORY_VIRTUAL_REPO}/:_auth=${ARTIFACTORY_AUTH}
email=${ARTIFACTORY_EMAIL}
always-auth=true
