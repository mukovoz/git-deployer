import crypto from 'crypto';

/**
 * Most Git vendors use same way to sign their requests
 * @param request
 * @param secret
 * @returns {boolean}
 */
const checkSignature = (request, secret) => {
    const signature = request.headers['x-hub-signature-256'];
    if (!signature)
        throw new Error('Signature is missed');

    const hmac = crypto.createHmac('sha256', secret);
    const digest = `sha256=${hmac.update(request.rawBody).digest('hex')}`;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
        throw new Error('Invalid signature');
    }
    return true;
}

const GithubResolver = (request, repository) => {
    checkSignature(request, repository?.secret);
    return {
        "branch": request.json.ref.substring(11)
    }

}
const BitBucketResolver = (request, repository) => {
    checkSignature(request, repository?.secret);
    return {
        "branch": request.json?.push.changes[0]?.new?.name
    }

}
const GitLabResolver = (
    request, repository
) => {
    if (request.headers['x-gitlab-token'] !== repository?.secret)
        throw new Error('Invalid token from GitLab');
    return {
        branch: request.json.ref.substring(11)
    }
}

/**
 * Custom integrations (CI, scripts, curl) authorize with "Authorization: Bearer <secret>".
 * Branch can be passed in JSON body as {"branch": "..."}, otherwise the configured branch is deployed.
 */
const CustomResolver = (request, repository) => {
    const [scheme, token] = (request.headers['authorization'] || '').split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token)
        throw new Error('Bearer token is missed');

    const expected = Buffer.from(String(repository?.secret ?? ''));
    const actual = Buffer.from(token);
    if (!expected.length || expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual))
        throw new Error('Invalid bearer token');

    return {
        branch: request.json?.branch ?? repository?.branch
    }
}


export default {
    'github': GithubResolver,
    'bitbucket': BitBucketResolver,
    'gitlab': GitLabResolver,
    'custom': CustomResolver
}