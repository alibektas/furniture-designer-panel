/**
 * MinIO (S3-compatible) object storage for artwork images + thumbnails.
 *
 * Config comes from the shared root .env (see ../../../.env / docker-compose
 * minio service). The `artwork` bucket is created with public-read by the
 * compose `minio-init` one-shot; `ensureBucket()` here is a belt-and-braces
 * fallback for when the panel runs against a fresh MinIO.
 */

import { Client } from 'minio';
import { env } from '$env/dynamic/private';

const endPoint = env.MINIO_ENDPOINT ?? 'localhost';
const port = Number(env.MINIO_PORT ?? '9000');
const useSSL = env.MINIO_USE_SSL === 'true';
const accessKey = env.MINIO_ACCESS_KEY ?? 'minioadmin';
const secretKey = env.MINIO_SECRET_KEY ?? 'minioadmin';

export const BUCKET = env.MINIO_BUCKET ?? 'artwork';

/**
 * Public base URL used to build browser-reachable object URLs. Falls back to
 * the host endpoint when MINIO_PUBLIC_URL is unset.
 */
const publicBase = (
	env.MINIO_PUBLIC_URL ?? `${useSSL ? 'https' : 'http'}://${endPoint}:${port}`
).replace(/\/$/, '');

export const minio = new Client({ endPoint, port, useSSL, accessKey, secretKey });

let bucketReady: Promise<void> | null = null;

/**
 * Ensure the artwork bucket exists and is publicly readable. Memoised so it
 * runs at most once per process. The compose init normally handles this; this
 * keeps local dev working if the bucket was wiped.
 */
export function ensureBucket(): Promise<void> {
	if (!bucketReady) {
		bucketReady = (async () => {
			const exists = await minio.bucketExists(BUCKET).catch(() => false);
			if (!exists) {
				await minio.makeBucket(BUCKET);
			}
			// Public read so stored object URLs resolve directly in the browser.
			const policy = {
				Version: '2012-10-17',
				Statement: [
					{
						Effect: 'Allow',
						Principal: { AWS: ['*'] },
						Action: ['s3:GetObject'],
						Resource: [`arn:aws:s3:::${BUCKET}/*`]
					}
				]
			};
			await minio.setBucketPolicy(BUCKET, JSON.stringify(policy)).catch(() => {
				// Non-fatal: policy may already be set by compose init.
			});
		})().catch((err) => {
			// Reset so a later call can retry after a transient failure.
			bucketReady = null;
			throw err;
		});
	}
	return bucketReady;
}

/** Upload a buffer and return its object key. */
export async function putObject(key: string, body: Buffer, contentType: string): Promise<string> {
	await ensureBucket();
	await minio.putObject(BUCKET, key, body, body.length, {
		'Content-Type': contentType
	});
	return key;
}

/** Remove an object; ignores "not found". */
export async function removeObject(key: string): Promise<void> {
	await minio.removeObject(BUCKET, key).catch(() => {});
}

/** Browser-reachable public URL for a stored object key. */
export function publicUrl(key: string): string {
	return `${publicBase}/${BUCKET}/${encodeURI(key)}`;
}
