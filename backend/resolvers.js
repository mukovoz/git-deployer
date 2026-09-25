import crypto from 'crypto';
import ApiError from "./ApiError.js";

/**
 * Constant-time string compare, safe for values of different length
 */
const safeEqual = (a, b) => {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Most Git vendors use same way to sign their requests.
 * GitHub sends X-Hub-Signature-256, Bitbucket sends X-Hub-Signature, both as "sha256=<hex>"
 * @param request
 * @param secret
 * @returns {boolean}
 */
const checkSignature = (request, secret) => {
    if (!secret)
        throw new ApiError('Secret is not configured for this repository', 401);
    const signature = request.headers['x-hub-signature-256'] ?? request.headers['x-hub-signature'];
    if (!signature)
        throw new ApiError('Signature is missed (is the webhook secret set?)', 401);

    const hmac = crypto.createHmac('sha256', secret);
    const digest = `sha256=${hmac.update(request.rawBody ?? '').digest('hex')}`;
    if (!safeEqual(signature, digest))
        throw new ApiError('Invalid signature', 401);
    return true;
}

/**
 * "refs/heads/main" -> "main", anything else (tags, missing ref) -> null
 */
const branchFromRef = (ref) => typeof ref === 'string' && ref.startsWith('refs/heads/') ? ref.substring(11) : null;

const GithubResolver = (request, repository) => {
    checkSignature(request, repository?.secret);
    return {
        "branch": branchFromRef(request.json?.ref)
    }

}
const BitBucketResolver = (request, repository) => {
    checkSignature(request, repository?.secret);
    // one push can contain several changes; deleted branches have new = null, tags have new.type = "tag"
    const branches = (request.json?.push?.changes || [])
        .filter(change => change?.new?.type === 'branch')
        .map(change => change.new.name);
    return {
        "branch": branches.includes(repository?.branch) ? repository.branch : (branches[0] ?? null)
    }

}
const GitLabResolver = (
    request, repository
) => {
    if (!repository?.secret || !safeEqual(request.headers['x-gitlab-token'] ?? '', repository.secret))
        throw new ApiError('Invalid token from GitLab', 401);
    return {
        branch: branchFromRef(request.json?.ref)
    }
}

/**
 * Custom integrations (CI, scripts, curl) authorize with "Authorization: Bearer <secret>".
 * Branch can be passed in JSON body as {"branch": "..."}, otherwise the configured branch is deployed.
 */
const CustomResolver = (request, repository) => {
    const [scheme, token] = (request.headers['authorization'] || '').split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token)
        throw new ApiError('Bearer token is missed', 401);

    if (!repository?.secret || !safeEqual(token, repository.secret))
        throw new ApiError('Invalid bearer token', 401);

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
