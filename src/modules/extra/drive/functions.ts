import { authenticate } from "@google-cloud/local-auth";
import { drive_v3, google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { cwd } from "process";

const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.install",
  "https://www.googleapis.com/auth/drive.appdata",
  "https://www.googleapis.com/auth/drive.appfolder",
];
const SESSION_STRING_PATH = join(
  cwd(),
  "sessions",
  "drive",
  "sessionstring.json"
);
const CREDENTIALS_PATH = join(cwd(), "sessions", "drive", "credentials.json");

async function loadSavedCredentialsIfExist(): Promise<OAuth2Client | null> {
  try {
    const content = await readFile(SESSION_STRING_PATH, {
      encoding: "utf8",
    });
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials) as OAuth2Client;
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client: OAuth2Client): Promise<void> {
  const content = await readFile(CREDENTIALS_PATH, { encoding: "utf8" });
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await writeFile(SESSION_STRING_PATH, payload);
}

async function authorize(): Promise<OAuth2Client> {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

const mimeTypeToEmoji: { [key: string]: string } = {
  // Common file types
  "application/vnd.google-apps.document": "📄", // Google Docs
  "application/vnd.google-apps.spreadsheet": "📊", // Google Sheets
  "application/vnd.google-apps.presentation": "📽", // Google Slides
  "application/vnd.google-apps.folder": "📁", // Google Drive folder
  "application/pdf": "📄", // PDF
  "image/jpeg": "🖼", // JPEG image
  "image/png": "🖼", // PNG image
  "audio/mpeg": "🎵", // MP3 audio
  "audio/wav": "🎵", // WAV audio
  "video/mp4": "🎥", // MP4 video
  "application/zip": "📦", // ZIP archive
  "text/plain": "📜", // Plain text

  // Add more mappings as needed
};

class Drive {
  private client: drive_v3.Drive;

  constructor(auth: OAuth2Client) {
    this.client = google.drive({
      version: "v3",
      auth: auth,
    });
  }

  async listAll(): Promise<Array<drive_v3.Schema$File> | Error> {
    try {
      const fields = "files(name, mimeType)";
      const result = await this.client.files.list({
        q: "'root' in parents",
        fields: fields,
      });
      const files = result.data.files;
      return files!;
    } catch (error) {
      return error as Error;
    }
  }

  async listFolders(): Promise<Array<drive_v3.Schema$File> | Error> {
    try {
      const fields = "files(name, mimeType)";
      const result = await this.client.files.list({
        q: "mimeType='application/vnd.google-apps.folder'",
        fields: fields,
      });
      const folders = result.data.files;
      return folders!;
    } catch (error) {
      return error as Error;
    }
  }

  async listNonFolders(): Promise<Array<drive_v3.Schema$File> | Error> {
    try {
      const fields = "files(name, mimeType)";
      const result = await this.client.files.list({
        q: "mimeType!='application/vnd.google-apps.folder'",
        fields: fields,
      });
      const nonFolders = result.data.files;
      return nonFolders!;
    } catch (error) {
      return error as Error;
    }
  }

  async createFolder(folderName: string) {
    const fileMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    };

    try {
      const folder = await this.client.files.create({
        requestBody: fileMetadata,
        fields: "id",
      });
      console.log("Folder Id:", folder.data.id);
      return folder.data.id;
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  }

  async formatList(files: Array<drive_v3.Schema$File>): Promise<string> {
    let text = "";
    files = files.sort((a, b) => a.name!.localeCompare(b.name!));
    files.forEach((file) => {
      const emoji = mimeTypeToEmoji[file.mimeType!] || "❓";
      text += `${emoji} ${file.name}\n`;
    });
    return text;
  }
}

export const drive = new Drive(await authorize());
//export const drive = google.drive({ version: "v3", auth: await authorize() });
