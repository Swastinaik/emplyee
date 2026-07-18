import fs from 'fs';
import path from 'path';

/**
 * Delete a file if it exists
 */
export const deleteFile = (relativeFilePath: string): void => {
  if (!relativeFilePath) return;

  try {
    const absolutePath = path.join(__dirname, '../../', relativeFilePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log(`Successfully deleted file: ${relativeFilePath}`);
    }
  } catch (error) {
    console.error(`Error deleting file ${relativeFilePath}:`, error);
  }
};
