const { BlobServiceClient } = require("@azure/storage-blob");
const path = require("path");

// Azure Storage Configuration
const AZURE_STORAGE_CONNECTION_STRING =
  process.env.AZURE_STORAGE_CONNECTION_STRING;

const CONTAINER_NAME = "profile-images"; // You can change this container name

// Initialize BlobServiceClient
let blobServiceClient;

if (AZURE_STORAGE_CONNECTION_STRING) {
  blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
  );
} else {
  console.error("Azure Storage connection string not found in environment variables");
}

/**
 * Upload a file to Azure Blob Storage
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} originalFilename - The original filename
 * @returns {Promise<string>} The URL of the uploaded file
 */
async function uploadToAzure(fileBuffer, originalFilename) {
  try {
    if (!blobServiceClient) {
      throw new Error("Azure Blob Service Client not initialized");
    }

    // Get or create container
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    
    // Create container if it doesn't exist (with public access for blobs)
    await containerClient.createIfNotExists({
      access: "blob", // Public read access for blobs
    });

    // Generate unique filename
    const fileExtension = path.extname(originalFilename);
    const uniqueFilename = `profile-${Date.now()}${fileExtension}`;

    // Get block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(uniqueFilename);

    // Set content type based on file extension
    const contentType = getContentType(fileExtension);

    // Upload the file
    await blockBlobClient.uploadData(fileBuffer, {
      blobHTTPHeaders: { blobContentType: contentType },
    });

    // Return the URL of the uploaded blob
    return blockBlobClient.url;
  } catch (error) {
    console.error("Error uploading to Azure:", error);
    throw error;
  }
}

/**
 * Delete a file from Azure Blob Storage
 * @param {string} blobUrl - The URL of the blob to delete
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function deleteFromAzure(blobUrl) {
  try {
    if (!blobServiceClient) {
      throw new Error("Azure Blob Service Client not initialized");
    }

    // Extract blob name from URL
    const urlParts = new URL(blobUrl);
    const blobName = urlParts.pathname.split("/").slice(2).join("/");

    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.deleteIfExists();
    return true;
  } catch (error) {
    console.error("Error deleting from Azure:", error);
    return false;
  }
}

/**
 * Get content type based on file extension
 * @param {string} extension - File extension
 * @returns {string} Content type
 */
function getContentType(extension) {
  const contentTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
  };

  return contentTypes[extension.toLowerCase()] || "application/octet-stream";
}

module.exports = {
  uploadToAzure,
  deleteFromAzure,
};
