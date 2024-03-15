import { CreateBucketCommand, HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { Progress, Upload } from "@aws-sdk/lib-storage";

export async function doesBucketExist(s3: S3Client, bucketName: string): Promise<boolean> {
    try {
        await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
        return true;
    } catch (err: any) {
        if (err.name === 'NotFound') {
            return false;
        }
        throw err;
    }
}

export function createBucket(s3: S3Client, bucketName: string) {
    return s3.send(new CreateBucketCommand({
        Bucket: bucketName
    }));
}


export async function tryCreateBucket(s3: S3Client, bucketName: string) {
    const exists = await doesBucketExist(s3, bucketName);
    if (!exists) {
        return createBucket(s3, bucketName);
    }
}


export async function uploadFile(s3: S3Client, source: ReadableStream, bucketName: string, file: string, onProgress?: (progress: Progress) => void) {

    const upload = new Upload({
        client: s3,
        params: {
            Bucket: bucketName,
            Key: file,
            Body: source,
        }
    });

    onProgress && upload.on("httpUploadProgress", onProgress);

    const result = await upload.done();
    return result;
}

/**
 * Create the bucket if not already exists and then upload the file.
 * @param s3 
 * @param source 
 * @param bucketName 
 * @param file 
 * @param onProgress 
 * @returns 
 */
export async function forceUploadFile(s3: S3Client, source: ReadableStream, bucketName: string, file: string, onProgress?: (progress: Progress) => void) {
    // make sure the bucket exists
    await tryCreateBucket(s3, bucketName);
    return uploadFile(s3, source, bucketName, file, onProgress);
}
