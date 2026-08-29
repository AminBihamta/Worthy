import * as FileSystem from 'expo-file-system/legacy';

export async function deleteLegacyReceiptFiles(): Promise<void> {
  if (!FileSystem.documentDirectory) return;
  await FileSystem.deleteAsync(`${FileSystem.documentDirectory}receipts`, { idempotent: true });
}
