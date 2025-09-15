// Import the S3 client constructor from the AWS SDK.
// This allows us to create an S3 client instance to interact with S3-compatible services.
// better to use => import { S3Client } from "@aws-sdk/client-s3"; v3 of sdk
import AWS from "aws-sdk";
const { S3 } = AWS;
import { writeFile } from "./fs.js";


// Create a new S3 client instance. This object will be used to make all our API calls to S3.
const s3 = new S3({
    // Your S3 access key. It's read from environment variables for security.
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    // Your S3 secret key. Also read from environment variables.
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    // The API endpoint. This allows using S3-compatible services like MinIO or DigitalOcean Spaces.
    // If this is not provided, it defaults to standard AWS S3.
    endpoint: process.env.S3_ENDPOINT
});

/**
 * Downloads all files from a specified S3 "folder" (prefix) to a local directory.
 * @param key - The S3 prefix to fetch files from (e.g., "code/project123/").
 * @param localPath - The absolute local path to download the files to (e.g., "/tmp/project123").
 */
export const fetchS3Folder = async (key: string, localPath: string): Promise<void> => {
    try {
        // Parameters for the S3 listObjectsV2 API call.
        const params = {
            Bucket: process.env.S3_BUCKET ?? "", // The name of the S3 bucket.
            Prefix: key                          // The "folder" or prefix to list files from.
        };

        // Call the S3 API to get a list of all objects under the specified prefix.
        // .promise() converts the AWS SDK's callback-based method to return a Promise.
        const response = await s3.listObjectsV2(params).promise();
        
        // Check if the response contains any file objects.
        if (response.Contents) {
            // Use Promise.all to execute all file download operations concurrently.
            // This is much faster than downloading files one by one (serially).
            await Promise.all(response.Contents.map(async (file) => {
                // Get the unique key (full path) for the individual S3 object.
                const fileKey = file.Key;
                if (fileKey) {
                    // Parameters for the S3 getObject API call.
                    const getObjectParams = {
                        Bucket: process.env.S3_BUCKET ?? "",
                        Key: fileKey
                    };

                    // Call the S3 API to download the actual content of the file.
                    const data = await s3.getObject(getObjectParams).promise();
                    
                    // The file content is in the 'Body' property of the response.
                    if (data.Body) {
                        //const fileData = data.Body;
                        const fileContentAsBuffer = Buffer.from(data.Body as string | Buffer);
                        // Construct the local file path. We remove the initial prefix to get the relative path.
                        // e.g., "code/project123/index.js" becomes "/index.js".
                        const filePath = `${localPath}/${fileKey.replace(key, "")}`;
                        
                        // Use our local helper function to write the downloaded content to a file.
                        await writeFile(filePath, fileContentAsBuffer);

                        console.log(`Downloaded ${fileKey} to ${filePath}`);
                    }
                }
            }));
        }
    } catch (error) {
        console.error('Error fetching folder:', error);
    }
};

/**
 * Copies a "folder" from a source location to a destination location, all within S3.
 * @param sourcePrefix - The S3 prefix of the folder to copy.
 * @param destinationPrefix - The S3 prefix where the folder should be copied to.
 * @param continuationToken - Used for pagination if the folder contains more than 1000 items.
 */
export async function copyS3Folder(sourcePrefix: string, destinationPrefix: string, continuationToken?: string): Promise<void> {
    try {
        // List all objects in the source folder.
        const listParams = {
            Bucket: process.env.S3_BUCKET ?? "",
            Prefix: sourcePrefix,
            ContinuationToken: continuationToken // Token to get the next "page" of results.
        };

        const listedObjects = await s3.listObjectsV2(listParams).promise();

        // If the folder is empty, there's nothing to do.
        if (!listedObjects.Contents || listedObjects.Contents.length === 0) return;
        
        // Copy each object to the new location in parallel for performance.
        await Promise.all(listedObjects.Contents.map(async (object) => {
            if (!object.Key) return; // Skip if the object has no key.
            // Calculate the new key for the destination object.
            // e.g., "base/node/index.js" becomes "code/project123/index.js".
            let destinationKey = object.Key.replace(sourcePrefix, destinationPrefix);
            
            // Parameters for the S3 copyObject API call.
            let copyParams = {
                Bucket: process.env.S3_BUCKET ?? "",
                // Source location format: "bucket-name/path/to/file.js".
                CopySource: `${process.env.S3_BUCKET}/${object.Key}`,
                Key: destinationKey
            };

            // This is a native S3 operation; data is copied within S3 servers and not downloaded.
            await s3.copyObject(copyParams).promise();
            console.log(`Copied ${object.Key} to ${destinationKey}`);
        }));

        // Handle pagination: S3 listObjectsV2 returns max 1000 items at a time.
        // If the list was truncated, we need to make another call to get the rest of the items.
        if (listedObjects.IsTruncated) {
            // Recursively call this function with the token for the next page of results.
            await copyS3Folder(sourcePrefix, destinationPrefix, listedObjects.NextContinuationToken);
        }
    } catch (error) {
        console.error('Error copying folder:', error);
    }
}

/**
 * Uploads or updates a single file in S3.
 * @param key - The base S3 prefix (e.g., "code/project123").
 * @param filePath - The relative path of the file (e.g., "/src/index.js").
 * @param content - The string content of the file to save.
 */
export const saveToS3 = async (key: string, filePath: string, content: string): Promise<void> => {
    // Parameters for the S3 putObject API call.
    const params = {
        Bucket: process.env.S3_BUCKET ?? "",
        Key: `${key}${filePath}`, // The full path/name for the object in S3.
        Body: content            // The file content.
    };
    
    // Uploads the object to S3. If an object with the same key exists, it will be overwritten.
    await s3.putObject(params).promise();
}
